const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect Routes
exports.protect = async (req, res, next) => {
    let token;
    
    // Check for Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from the token and attach to req
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ error: 'User associated with this token no longer exists' });
            }
            
            next();
        } catch (err) {
            console.error('Auth Error:', err.message);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }
    
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
