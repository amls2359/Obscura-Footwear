const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: { type: String },
    username:{type:String},
    isblocked: {type: Boolean,default:false},
    phone : {type:Number},
    wallet : {type:Number,default:0},
    referralcode:{type:String},
    googleId:{type:String},
    isDeleted: { type: Boolean, default: false } 

});


module.exports = mongoose.model('User', userSchema);

