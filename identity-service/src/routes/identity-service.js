import express from "express";
import { checkRefreshToken, loginUser, logoutUser, registerUser } from "../controllers/identity-controller.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", checkRefreshToken);
router.post("/logout", logoutUser);

export default router;