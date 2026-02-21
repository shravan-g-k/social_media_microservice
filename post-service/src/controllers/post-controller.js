import Post from "../models/Post.js";
import logger from "../utils/logger.js";
import { validateCreatePost } from "../utils/validator.js";


const invalidatePostsCache = async (req, input) => {
    await req.redisClient.del(`post:${input}`);
    const keys = await req.redisClient.keys('posts:*');
    console.log(keys);
    if (keys.length > 0) {
        req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
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
        const { content, mediaIds } = req.body;
        const newPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newPost.save();
        invalidatePostsCache(req, newPost._id.toString());
        logger.info("Post created successfully");
        res.status(201).json({
            success: true,
            message: "Post created successfully"
        })

    } catch (error) {
        logger.error("Error creating post", error);
        res.status(500).json({
            success: false,
            message: "Error creating post"
        })
    }
}
const getAllPosts = async (req, res) => {
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
            success: false,
            message: "Error getting posts"
        })
    }
}

const getPost = async (req, res) => {
    try {
        const id = req.params.id;
        const cacheKey = `post:${id}`;

        const cachePost = await req.redisClient.get(cacheKey);

        if (cachePost) {
            return res.json(JSON.parse(cachePost));
        }

        const post = await Post.findById(id);
        if (!post) {
            logger.warn("Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));
        res.json(post);
    } catch (error) {
        logger.error("Error getting post", error);
        res.status(500).json({
            success: false,
            message: "Error getting post"
        })
    }
}

const deletePost = async (req, res) => {
    try {
        const id = req.params.id;
        const post = await Post.findOneAndDelete({ _id: id, user: req.user.userId });
        if (!post) {
            logger.warn("Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }
        invalidatePostsCache(req, id);
        res.json({
            success: true,
            message: "Post deleted successfully"
        })
    } catch (error) {
        logger.error("Error deleting post", error);
        res.status(500).json({
            success: false,
            message: "Error deleting post"
        })
    }
}

export {
    createPost,
    getAllPosts,
    getPost,
    deletePost
}