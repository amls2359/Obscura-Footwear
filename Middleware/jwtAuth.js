const jwt = require('jsonwebtoken');
const { verifyAccessToken, verifyAdminAccessToken } = require('../config/jwtConfig');

const jwtAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = verifyAccessToken(token);

            if (!decoded) {
                const wantsHtml = (req.headers.accept || '').includes('text/html');
                if (wantsHtml) {
                    return res.redirect('/UserLogin');
                }
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token.',
                });
            }

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
            req.tokenExpiry = decoded.exp;
            return next();
        }

        // Browser navigation after login (session set in userLoginPost)
        if (req.session?.isAuthenticated && req.session?.userid) {
            req.user = {
                userId: req.session.userid,
                email: req.session.email,
                role: req.session.role || 'user',
            };
            return next();
        }

        const wantsHtml = (req.headers.accept || '').includes('text/html');
        if (wantsHtml) {
            return res.redirect('/UserLogin');
        }

        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    } catch (error) {
        console.error('JWT Auth Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};

const optionalJwtAuth = async (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            const decoded = verifyAccessToken(token);
            if (decoded) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role
                };
            }
        }

        next();
    } catch (error) {
        next();
    }
};


const verifyRefreshTokenMiddleware = async (req, res, next) => {
    try {
        let refreshToken = null;

        // Get refresh token from body, cookie, or header
        if (req.body.refreshToken) {
            refreshToken = req.body.refreshToken;
        } else if (req.cookies && req.cookies.refreshToken) {
            refreshToken = req.cookies.refreshToken;
        } else if (req.headers['x-refresh-token']) {
            refreshToken = req.headers['x-refresh-token'];
        }

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        const { verifyRefreshToken } = require('../config/jwtConfig');
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        req.refreshToken = refreshToken;
        req.refreshTokenData = decoded;

        next();
    } catch (error) {
        console.error('Refresh Token Verification Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};


function extractToken(req) {
    // From Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // From cookie
    if (req.cookies && req.cookies.accessToken) {
        return req.cookies.accessToken;
    }

    // From query string
    if (req.query.token) {
        return req.query.token;
    }

    // From custom header
    if (req.headers['x-access-token']) {
        return req.headers['x-access-token'];
    }

    return null;
}


const jwtAdminAuth = async (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            const decoded = verifyAdminAccessToken(token);

            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token.',
                });
            }

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                isSuperAdmin:
                    decoded.isSuperAdmin ||
                    (decoded.role || '').toLowerCase() === 'superadmin',
            };

            return next();
        }

        // Browser session fallback (after login redirect)
        if (req.session && (req.session.isSuperAdmin || req.session.admin)) {
            req.user = {
                userId: req.session.userid,
                email: req.session.email,
                role: req.session.role || 'superAdmin',
                isSuperAdmin: true,
            };
            return next();
        }

        const wantsHtml = (req.headers.accept || '').includes('text/html');
        if (wantsHtml) {
            return res.redirect('/admin/adminLogin');
        }

        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    } catch (error) {
        console.error('JWT Auth Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};




module.exports = {
    jwtAuth,
    jwtAdminAuth,
    optionalJwtAuth,
    verifyRefreshTokenMiddleware,
    extractToken
};