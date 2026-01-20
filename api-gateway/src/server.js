import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import proxy from 'express-http-proxy';
import {RedisStore} from 'rate-limit-redis';
import logger from './utils/logger.js';
import errorHandler from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_HOST);

app.use(helmet());
app.use(cors());
app.use(express.json());
 

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

app.use(rateLimiter);

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');

    },
    proxyErrorHandler: (err, res, next) => {
        logger.error('Proxy error:', err);
        res.status(500).json({ message: 'Internal Server Error', success: false });
    }
    
};

app.use('/v1/auth',proxy(
    process.env.IDENTITY_SERVICE_URL,{
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers['x-api-gateway'] = 'api-gateway';
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response from Identity Service for ${userReq.method} ${userReq.url}: ${proxyRes.statusCode}`);
            return proxyResData;
        }
    }
));

app.use(errorHandler);


app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis Host: ${process.env.REDIS_HOST}`);
});