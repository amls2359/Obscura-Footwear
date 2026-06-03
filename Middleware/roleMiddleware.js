
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    const role = (req.user.role || '').toLowerCase();
    if (role !== 'superadmin' || !req.user.isSuperAdmin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Super Admin only.' 
        });
    }

    next();
};


const isUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. User portal only.' 
        });
    }

    next();
};

module.exports = { isSuperAdmin, isUser };