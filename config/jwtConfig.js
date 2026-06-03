const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
        payload, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};


const generateSuperAdminTokens = (superAdmin) => {
    const payload = {
        userId: superAdmin._id,
        email: superAdmin.email,
        role: 'superAdmin',
        isSuperAdmin: true,
        permissions: ['full_access', 'manage_users', 'system_settings', 'view_analytics']
    };

    const accessToken = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_SUPERADMIN_ACCESS_EXPIRY || '1h' }
    );

    const refreshToken = jwt.sign(
        payload, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: process.env.JWT_SUPERADMIN_REFRESH_EXPIRY || '30d' }
    );

    return { accessToken, refreshToken };
};


const verifyAdminAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Access token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Invalid access token');
        }
        return null;
    }
};


const verifyAdminRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Refresh token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Invalid refresh token');
        }
        return null;
    }
};

module.exports = 
{
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateSuperAdminTokens,
  verifyAdminAccessToken,
  verifyAdminRefreshToken
};