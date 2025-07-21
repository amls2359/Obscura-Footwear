const mongoose = require('mongoose');
const Category = require('./category');

const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']    
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive']
    },
    model: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: [String],
        default: []
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative']
    },
    brand: {
        type: String,
        trim: true 
    },
    isListed: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);