const mongoose = require('mongoose');


const adminloginschema = new mongoose.Schema({ 
  
    email:{
        type:String,
        required:true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [ 'superAdmin'],
        default: 'superAdmin'
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    refreshToken: String,
    isblocked: {
        type: Boolean,
        default: false
    }
})

const admin = mongoose.model("admin", adminloginschema)

module.exports = admin;