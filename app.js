const express = require('express');
const mongoose = require('mongoose');
const UserRouter = require('./routes/UserRouter');
const adminRoute = require('./routes/adminRoute');
const productRoute = require('./routes/productRoute');
const cartRoute=require('./routes/cartRoute')
const userProfileRoute = require('./routes/userProfileRoute')
const couponRoute = require('./routes/couponRoute')
const orderRoute = require('./routes/orderRoute')
const paymentRoute = require('./routes/paymentRoute')
const salesRoute = require('./routes/salesRoute')
const path = require('path');
const methodOverride= require('method-override')
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Add this package
const flash= require('express-flash')
process.removeAllListeners('warning');
require('./auth/passport')
require('dotenv').config();
const passport = require('passport')
const { MongoClient } = require('mongodb');


const app = express();
const port = process.env.PORT || 3001;

app.use(session({
  secret: 'your-secret-key-should-be-long-and-complex',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 30 * 60 // ⏱ 30 minutes in seconds
  }),
  cookie: {
    maxAge: 1000 * 60 * 30, // ⏱ 30 minutes in milliseconds
    secure: false, // set to true in production with HTTPS
  }
}));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(passport.initialize());
app.use(passport.session());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/', (req, res) => {
  res.redirect('/guesthomepage');
});


app.use('/', UserRouter);
app.use('/', productRoute); 
app.use('/admin', adminRoute);
app.use('/',cartRoute)
app.use('/',userProfileRoute)
app.use('/',couponRoute)
app.use('/',orderRoute)
app.use('/',paymentRoute)
app.use('/',salesRoute)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
      errorMessage: 'Something went wrong!',
      errors: {},
      formData: {},
      categories: [] 
    });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session during logout:', err);
            return res.redirect('/Homepage'); // Or show an error page
        }
        res.clearCookie('connect.sid'); // Optional: clears session cookie
        return res.redirect('/guesthomepage');
    });
});


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  
  // Start the server only after DB is connected
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})
.catch((err) => console.error('❌ MongoDB connection error:', err));