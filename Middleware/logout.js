

const logoutIfNeeded = (req, res, next) => {
  // For example, check if a query like ?logout=true is sent
  if (req.query.logout === 'true') {
    req.session.destroy((err) => {
      if (err) {
        console.log('Error destroying session:', err);
        return res.redirect('/Homepage');
      }
      res.clearCookie('connect.sid');
      return res.redirect('/guesthomepage');
    });
  } else {
    next(); // Continue to Homepage controller
  }
};

module.exports = {logoutIfNeeded}
