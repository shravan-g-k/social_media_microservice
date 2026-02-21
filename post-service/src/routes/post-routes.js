import express from "express";
import {authenticatedRequest} from "../middleware/authMiddleware.js"
import {createPost,getAllPosts,getPost,deletePost} from "../controllers/post-controller.js"

const router = express.Router();


router.use(authenticatedRequest);

router.post('/create-post', createPost)
router.get('/all-posts', getAllPosts)
router.get('/:id', getPost)
router.delete('/:id', deletePost)

export {router};