// config/token.js
import jwt from "jsonwebtoken";

const genToken = (userId) => {
    return jwt.sign(
        { userId: userId.toString() }, // CRITICAL: Must have "userId" field
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export default genToken;
