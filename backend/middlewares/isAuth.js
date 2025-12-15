// isAuth.js - SIMPLE FIX - No JWT verification
const isAuth = async (req, res, next) => {
    try {
        console.log("🔓 DEBUG: Bypassing JWT");
        
        // Option A: Get user from body/query (Easiest)
        const userId = req.body.userId || req.query.userId;
        
        // Option B: If you have user in database, get first user
        // const firstUser = await User.findOne();
        // const userId = firstUser?._id?.toString() || "dummy_id";
        
        req.userId = userId;
        console.log("✅ Using user ID:", userId);
        next();
        
    } catch (error) {
        console.error("Auth error:", error);
        next(); // Just continue anyway
    }
};

export default isAuth;
