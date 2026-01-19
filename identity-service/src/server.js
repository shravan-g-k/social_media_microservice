import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from 'rate-limit-redis'
import Redis from "ioredis";
import identityRouter from "./routes/identity-service.js";
import errorHandler from "./middleware/error-handler.js";


const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL).then(() => {
    logger.info("Connected to Mongo DB");
}).catch((err) => {
    console.log(process.env.MONGODB_URL);
    logger.error("Error connecting to Mongo DB", err);
});

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1,
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => {
        next();
    }).catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: "Too many requests. Please try again later.",
            success: false
        });
    });
});

const sensitiveEndpointRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: "Too many requests to this endpoint. Please try again later.",
            success: false
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
})

app.use("/api/auth/register", sensitiveEndpointRateLimiter);

app.use("/api/auth", identityRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity Service running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});