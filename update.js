const mongoose = require('mongoose');
const Category = require('./models/category')
const { ObjectId } = mongoose.Types;

// Replace with your actual MongoDB URI
const mongoURI = 'mongodb://127.0.0.1:27017/mymvcproject';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');

 const result= await Category.updateMany(
  { islisted: false },
  { $set: { islisted: true } }
);
  console.log('✅ All category documents updated');
  mongoose.disconnect();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});
