const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require("dotenv").config();
const UserCollection = require('../models/user');

const generateReferralCode = (length) => {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let referralCode = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }

  return referralCode;
};

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  UserCollection.findById(id)
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

console.log('✅ CLIENT_ID:', process.env.CLIENT_ID);
console.log('✅ CLIENT_SECRET:', process.env.CLIENT_SECRET);
console.log('✅ CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

passport.use(
  new GoogleStrategy(
    {
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔐 Google profile:', profile._json);

        const email = profile.emails[0].value;

        // Check for existing user by email
        let existingUser = await UserCollection.findOne({ email });

        if (existingUser) {
          if (existingUser.isDeleted) {
            return done(null, false, { message: 'Account has been deleted' });
          }

          // ✅ User exists — login allowed
          return done(null, existingUser);
        }

        // Prevent duplicate GoogleId creation too
        const duplicateGoogleId = await UserCollection.findOne({ googleId: profile.id });
        if (duplicateGoogleId) {
          return done(null, duplicateGoogleId);
        }

        // ✅ Create new user
        const referralCode = generateReferralCode(8);

        const newUser = new UserCollection({
          username: profile.displayName,
          googleId: profile.id,
          email: email,
          referralcode: referralCode,
          image: profile.photos[0].value, // optional
        });

        const savedUser = await newUser.save();
        return done(null, savedUser);

      } catch (error) {
        console.error('🔥 Error in GoogleStrategy:', error);
        return done(error, null);
      }
    }
  )
);


