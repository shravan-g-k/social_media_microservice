import logger from "../utils/logger.js";

import jwt from 'jsonwebtoken';

const validateToken = (req,res,next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){
        logger.warn("Unauthorized request");
        return res.status(401).json({
            success : false,
            message : "Unauthorized"
        })
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err){
            logger.warn("Unauthorized request");
            return res.status(401).json({
                success : false,
                message : "Unauthorized"
            })
        }
        req.user = user;
        next();
    })
 }

 export {validateToken};