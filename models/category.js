// models/category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  islisted: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Category', categorySchema);