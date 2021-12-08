
const mongoose = require('mongoose');

var accountSchema = new mongoose.Schema({
    username: String,
    password: String
});
module.exports = mongoose.model('account', accountSchema);