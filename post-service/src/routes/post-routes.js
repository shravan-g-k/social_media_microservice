import express from "express";
import {authenticatedRequest} from "../middleware/authMiddleware.js"
import {createPost,getAllPosts} from "../controllers/post-controller.js"

const router = express.Router();


router.use(authenticatedRequest);

router.post('/create-post', createPost)
router.get('/all-posts', getAllPosts)

export {router};