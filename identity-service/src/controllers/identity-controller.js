import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateLoginUser, validateRegisterUser } from "../utils/validator.js";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
const registerUser = async (req, res) => {
  logger.info("Register user endpoint");
  try {
    const { error } = validateRegisterUser(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, password, email } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    
    user = new User({ username, password, email });
    await user.save();
    logger.info("User registered successfully", user._id);

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error registering user", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  logger.info("Login user endpoint");
  try {
    const { error } = validateLoginUser(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("User doesnt exist");
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Wrong password");
      return res.status(400).json({
        message: "Wrong Password",
        success: false,
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Error logging in user", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const checkRefreshToken = async (req, res) => {
  logger.info("Check refresh token endpoint");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res.status(400).json({
        success: false,
        message: "Refresh token not found",
      });
    }
    const token = await RefreshToken.findOne({ token: refreshToken });
    if (!token || token.expiresAt < Date.now()) {
      logger.warn("Invalid refresh token or token expired");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token or token expired",
      });
    }

    const user = await User.findById(token.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshToken.deleteOne({ _id: token._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error getting refresh token", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res.status(400).json({
        success: false,
        message: "Refresh token not found",
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted (logout)");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Error logging out user", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export { registerUser, loginUser, checkRefreshToken, logoutUser };
