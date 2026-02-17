import Post from "../models/Post.js";
import logger from "../utils/logger.js";

const createPost =async (req,res)=>{
    try {
        const {content, mediaIds} = req.body;
        const newPost = new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || []
        })

        await newPost.save();
        logger.info("Post created successfully");
        res.status(201).json({
            success : true,
            message : "Post created successfully"
        })
        
    } catch (error) {
        logger.error("Error creating post", error);
        res.status(500).json({
            success : false,
            message : "Error creating post"
        })
    }
}
const getAllPosts =async (req,res)=>{
    try {
        
    } catch (error) {
        logger.error("Error getting posts", error);
        res.status(500).json({
            success : false,
            message : "Error getting posts"
        })
    }
}

const getPost =async (req,res)=>{
    try {
        
    } catch (error) {
        logger.error("Error getting post", error);
        res.status(500).json({
            success : false,
            message : "Error getting post"
        })
    }
}

const deletePost =async (req,res)=>{
    try {
        
    } catch (error) {
        logger.error("Error deleting post", error);
        res.status(500).json({
            success : false,
            message : "Error deleting post"
        })
    }
}

export {
    createPost,
    getAllPosts,
    getPost,
    deletePost
}