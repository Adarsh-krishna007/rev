import sendMail from "../config/Mail.js";
import genToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
    try {
        const { name, email, password, userName } = req.body;
        
        // Check if email exists
        const findByEmail = await User.findOne({ email });
        if (findByEmail) {
            return res.status(400).json({ message: "Email already exists!" });
        }
        
        // Check if username exists
        const findByUserName = await User.findOne({ userName });
        if (findByUserName) {
            return res.status(400).json({ message: "Username already exists!" });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            userName,
            email,
            password: hashedPassword
        });

        // Generate token
        const token = genToken(user._id);

        // FIXED: Correct cookie settings for Render.com
        const isProduction = process.env.NODE_ENV === "production";
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction, // true on Render (HTTPS), false locally
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/" // Available on all routes
        });

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            userName: user.userName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt
        };

        return res.status(201).json({
            message: "Signup successful",
            user: userResponse,
            token: token // For debugging, remove in production
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: `Signup error: ${error.message}` });
    }
};

export const signIn = async (req, res) => {
    try {
        const { password, userName } = req.body;
        
        // Find user
        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

        // Generate token
        const token = genToken(user._id);

        // FIXED: Correct cookie settings
        const isProduction = process.env.NODE_ENV === "production";
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            userName: user.userName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt
        };

        return res.status(200).json({
            message: "Signin successful",
            user: userResponse,
            token: token // For debugging
        });

    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({ message: `Signin error: ${error.message}` });
    }
};

export const signOut = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production";
        
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/"
        });
        
        return res.status(200).json({ message: "Signed out successfully" });
    } catch (error) {
        console.error("Signout error:", error);
        return res.status(500).json({ message: `Signout error: ${error.message}` });
    }
};

// OTP functions remain the same
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;

        await user.save();
        await sendMail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully" });

    } catch (error) {
        console.error("Send OTP error:", error);
        return res.status(500).json({ message: `Send OTP error: ${error.message}` });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({ message: `Verify OTP error: ${error.message}` });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isOtpVerified = false;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: `Reset password error: ${error.message}` });
    }
};
