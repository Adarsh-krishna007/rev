// middlewares/isAuth.js
import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        // Try to get token from multiple sources
        let token = req.cookies?.token;
        
        // Also check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }
        
        console.log("🔍 AUTH DEBUG - Token exists:", !!token);
        
        if (!token) {
            console.log("❌ No token found. Using fallback for development.");
            // DEVELOPMENT FALLBACK - REMOVE IN PRODUCTION
            req.userId = "693fb8611ad306602c8b1379";
            return next();
        }
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token decoded:", decoded);
        
        // Get userId from decoded token
        req.userId = decoded.userId || decoded.id || decoded._id;
        
        if (!req.userId) {
            console.log("⚠️ No userId in token, using fallback");
            req.userId = "693fb8611ad306602c8b1379";
        }
        
        console.log("✅ Authentication successful, userId:", req.userId);
        next();
        
    } catch (error) {
        console.error("❌ Auth error:", error.name, error.message);
        
        // DEVELOPMENT: Continue anyway with fallback user
        req.userId = "693fb8611ad306602c8b1379";
        console.log("⚠️ DEVELOPMENT: Bypassing auth error, using userId:", req.userId);
        next();
        
        // PRODUCTION CODE (comment out above 3 lines, uncomment below):
        /*
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(500).json({ message: "Authentication failed" });
        */
    }
};

export default isAuth;
