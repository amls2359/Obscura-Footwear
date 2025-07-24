const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require("dotenv").config();
const UserCollection = require('../models/user')

const generateReferralCode = (length)=>{
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let referralCode=''

  for(let i=0 ; i < length; i++)
  {
    const randomIndex = Math.floor(Math.random() *characters.length )
    referralCode+=characters[randomIndex]
  }
  return referralCode
}

passport.serializeUser((user,done)=>{
  done(null,user.id)
})

passport.deserializeUser((id,done)=>{
   UserCollection.findById(id).then((user)=>{
    done(null,user)
   })
})

passport.use(
  new GoogleStrategy (
    {
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    clientID :  process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
  },
  (accessToken,refreshToken,profile,done)=>{
      console.log(profile._json);

UserCollection.findOne({ googleId: profile.id }).then((currentUser) => {
  if (currentUser) {
    if (currentUser.isDeleted) {
      // Block login for deleted users
      return done(null, false, { message: 'Account has been deleted' });
    }

    // Allow login
    return done(null, currentUser);
  } else {
    // ❗ Check if email was previously deleted
    UserCollection.findOne({ email: profile.emails[0].value, isDeleted: true }).then((deletedUser) => {
      if (deletedUser) {
        // Block re-creation
        return done(null, false, { message: 'Account has been deleted' });
      }

      // Create new user
      const referralCode = generateReferralCode(8);

      new UserCollection({
        username: profile.displayName,
        googleId: profile.id,
        email: profile.emails[0].value,
        referralcode: referralCode
      })
      .save()
      .then((newUser) => done(null, newUser));
    });
  }
});

  }
)
)