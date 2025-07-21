const mongoose = require('mongoose')
const Category = require('./category')// eslint-disable-line no-unused-vars
const categoryOfferSchema = new mongoose.Schema({

    category: 
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
    alloffer:{type:Number}
})

const categoryOffer = mongoose.model('categoryOffer',categoryOfferSchema)
module.exports = categoryOffer