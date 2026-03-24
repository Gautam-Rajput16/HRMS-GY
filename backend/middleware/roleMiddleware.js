/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
        });
    }
};

/**
 * Middleware to check if user has employee role
 */
const isEmployee = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Employee privileges required.',
        });
    }
};

/**
 * Middleware to check if user has developer role
 */
const isDeveloper = (req, res, next) => {
    if (req.user && req.user.role === 'developer') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Developer privileges required.',
        });
    }
};

/**
 * Middleware to check if user has HR role
 */
const isHR = (req, res, next) => {
    if (req.user && req.user.role === 'hr') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. HR privileges required.',
        });
    }
};

/**
 * Middleware to check if user has admin or HR role
 */
const isAdminOrHR = (req, res, next) => {
    if (req.user && ['admin', 'hr'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin or HR privileges required.',
        });
    }
};

/**
 * Middleware to check if user has any of the specified roles
 * @param {Array<string>} roles - Array of allowed roles
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(' or ')}`,
            });
        }
    };
};

module.exports = { isAdmin, isEmployee, isDeveloper, isHR, isAdminOrHR, hasRole };

