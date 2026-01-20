import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import {validateLoginUser, validateRegisterUser} from "../utils/validator.js";
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

const loginUser = async(req,res)=>{
    logger.info("Login user endpoint");
    try {
        const {error} = validateLoginUser(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {email,password} = req.body;

        const user = await User.findOne({email});

        if(!user){
            logger.warn("User doesnt exist");
            return res.status(400).json({
                message : "Invalid credentials",
                success : false
            });
        }
        
        const isValidPassword = await user.comparePassword(password);
        if(!isValidPassword){
            logger.warn("Wrong password");
            return res.status(400).json({
                message : "Wrong Password",
                success : false
            });
        }

        const {accessToken,refreshToken} = await generateToken(user);

        res.json({
            accessToken,
            refreshToken,
            userId : user._id
        });
        
    } catch (error) {
        logger.error("Error logging in user",error);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }

}

export {registerUser, loginUser};