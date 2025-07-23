const User = require('../models/user');

const checkSessionBlocked = async (req, res, next) => {
    try {
                console.log('Middleware - Session:', req.session);
        // Check for session existence
        if (!req.session.userid || !req.session.isAuthenticated) {
            console.log('Session invalid or unauthenticated');
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
                return res.redirect('/guesthomepage');
            });
            return; // Ensure no further code is run
        }

        // If user is blocked
        if (userdetails.isblocked) {
            req.session.destroy((err) => {
                if (err) console.log('Error destroying session:', err);
                 return res.redirect('/UserLogin?message=account_blocked');
            });
            return;
        }

        // If all checks passed
        next();
    } catch (error) {
        console.error('Middleware error:', error);
        return res.redirect('/error');
    }
};

module.exports = { checkSessionBlocked };
