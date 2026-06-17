const jwt = require('jsonwebtoken');
const { verifyAccessToken, verifyAdminAccessToken } = require('../config/jwtConfig');

const jwtAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;

        // No access token at all
        if (!accessToken) {
            return res.redirect('/UserLogin');
        }

        try {
            // Verify access token
            const decoded = jwt.verify(
                accessToken,
                process.env.JWT_ACCESS_SECRET
            );

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            return next();

        } catch (err) {

            // Only attempt refresh if access token expired
            if (err.name !== 'TokenExpiredError') {
                return res.redirect('/UserLogin');
            }

            // Access token expired → check refresh token
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.redirect('/UserLogin');
            }

            try {
                // Verify refresh token
                const refreshDecoded = jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );

                // Generate new access token
                const newAccessToken = jwt.sign(
                    {
                        userId: refreshDecoded.userId,
                        email: refreshDecoded.email,
                        role: refreshDecoded.role || 'user'
                    },
                    process.env.JWT_ACCESS_SECRET,
                    {
                        expiresIn: '15m'
                    }
                );

                // Set new access token cookie
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60 * 1000, // 15 minutes
                    path: '/'
                });

                req.user = {
                    userId: refreshDecoded.userId,
                    email: refreshDecoded.email,
                    role: refreshDecoded.role || 'user'
                };

                return next();

            } catch (refreshError) {

                // Refresh token invalid or expired
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');

                return res.redirect('/UserLogin');
            }
        }

    } catch (error) {
        console.error('JWT Middleware Error:', error);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.redirect('/UserLogin');
    }
};


const jwtAdminAuth = async (req, res, next) => {
    try {
        let accessToken = null;

        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.split(' ')[1];
        }

        // Or from cookie
        if (!accessToken && req.cookies?.accessToken) {
            accessToken = req.cookies.accessToken;
        }

        // No access token at all
        if (!accessToken) {
            return res.redirect('/admin/adminLogin');
        }

        try {
            // Verify access token
            const decoded = jwt.verify(
                accessToken,
                process.env.JWT_ACCESS_SECRET
            );

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                isSuperAdmin:
                    decoded.isSuperAdmin ||
                    (decoded.role || '').toLowerCase() === 'superadmin',
            };

            return next();

        } catch (err) {

            // Only attempt refresh if token expired
            if (err.name !== 'TokenExpiredError') {
                return res.redirect('/admin/adminLogin');
            }

            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.redirect('/admin/adminLogin');
            }

            try {

                // Verify refresh token
                const refreshDecoded = jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );

                // Generate new access token
                const newAccessToken = jwt.sign(
                    {
                        userId: refreshDecoded.userId,
                        email: refreshDecoded.email,
                        role: refreshDecoded.role,
                        isSuperAdmin: refreshDecoded.isSuperAdmin || false
                    },
                    process.env.JWT_ACCESS_SECRET,
                    {
                        expiresIn: '15m'
                    }
                );

                // Set new access token cookie
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60 * 1000,
                    path: '/'
                });

                req.user = {
                    userId: refreshDecoded.userId,
                    email: refreshDecoded.email,
                    role: refreshDecoded.role,
                    isSuperAdmin:
                        refreshDecoded.isSuperAdmin ||
                        (refreshDecoded.role || '').toLowerCase() === 'superadmin',
                };

                return next();

            } catch (refreshError) {

                console.error('Admin Refresh Token Error:', refreshError);

                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');

                return res.redirect('/admin/adminLogin');
            }
        }

    } catch (error) {

        console.error('Admin JWT Auth Error:', error);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.redirect('/admin/adminLogin');
    }
};



module.exports = {
    jwtAuth,
    jwtAdminAuth,
};