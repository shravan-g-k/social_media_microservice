import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import {validateRegisterUser} from "../utils/validator.js";
import User from "../models/User.js";
const registerUser = async(req,res)=>{
    logger.info("Register user endpoint");
    try {
        const {error} = validateRegisterUser(req.body);
        if(error){
            logger.warn("Validation error",error.details[0].message);
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }
        const {username,password,email} = req.body;
        let user = await User.findOne({$or : [{username},{email}]});
        if(user){
            logger.warn("User already exists");
            return res.status(400).json({
                success : false,
                message : "User already exists"
            })

        }
        user = new User({username,password,email});
        await user.save();
        logger.info("User registered successfully",user._id);
        
        const {accessToken,refreshToken} = await generateToken(user);

        res.status(201).json({
            success : true,
            message : "User registered successfully",
             accessToken,
                refreshToken
        })
    } catch (error) {
        logger.error("Error registering user",error.message);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }

}

export {registerUser};