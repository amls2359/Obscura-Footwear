const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  creditordebit: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  }
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
