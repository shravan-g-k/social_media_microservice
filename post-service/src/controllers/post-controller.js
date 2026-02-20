import Post from "../models/Post.js";
import logger from "../utils/logger.js";
import { validateCreatePost } from "../utils/validator.js";

const createPost =async (req,res)=>{
    logger.info("Create post endpoint");
    try {
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentpage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts,
        };

        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.json(result);
        
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