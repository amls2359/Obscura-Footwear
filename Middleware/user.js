const User = require('../models/user');

const checkSessionBlocked = async (req, res, next) => {
    try {
        console.log('Middleware - Session:', req.session);
        
        // Check if this is an API request (expecting JSON)
        const isApiRequest = req.xhr || 
                            req.headers.accept?.includes('application/json') || 
                            req.path.includes('/api/') ||
                            req.originalUrl === '/allproduct'; // Add specific API paths here
        
        // Check for session existence
        if (!req.session.userid || !req.session.isAuthenticated) {
            console.log('Session invalid or unauthenticated');
            
            // For API requests, return JSON error
            if (isApiRequest) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login.',
                    redirectTo: '/UserLogin'
                });
            }
            
            // For browser requests, redirect to guest homepage
            return res.redirect('/guesthomepage');
        }

        console.log('--- SESSION DEBUG ---');
        console.log('Session:', req.session);
        console.log('User ID:', req.session.userid); 

        const userdetails = await User.findById(req.session.userid);
        console.log('User details:', userdetails);

        // If user no longer exists
        if (!userdetails) {
            req.session.destroy((err) => {
                if (err) console.log('Error destroying session:', err);
                
                if (isApiRequest) {
                    return res.status(401).json({
                        success: false,
                        message: 'User account not found'
                    });
                }
                return res.redirect('/guesthomepage');
            });
            return;
        }

        // If user is blocked
        if (userdetails.isblocked) {
            req.session.destroy((err) => {
                if (err) console.log('Error destroying session:', err);
                
                if (isApiRequest) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account has been blocked'
                    });
                }
                return res.redirect('/UserLogin?message=account_blocked');
            });
            return;
        }

        // If all checks passed
        next();
    } catch (error) {
        console.error('Middleware error:', error);
        
        // Check if API request
        const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
        
        if (isApiRequest) {
            return res.status(500).json({
                success: false,
                message: 'Server error occurred'
            });
        }
        return res.redirect('/error');
    }
};

module.exports = { checkSessionBlocked };
