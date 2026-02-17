import logger from "../utils/logger.js";

const authenticatedRequest = (req,res,next)=>{
    const userId = req.headers['x-user-id'];
    if(!userId){
        logger.warn("Unauthorized request");
        return res.status(401).json({
            success : false,
            message : "Unauthorized"
        })
    }
    req.user = {userId};
    next();
}


export {authenticatedRequest};