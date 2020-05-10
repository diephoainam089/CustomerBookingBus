var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schema = new Schema({
    storeName: { type: String, required: true },
    address: { type: String, require: true },
    phoneNum: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String },
    logoImage: String,
    imageGroup: []
})
module.exports = mongoose.model('store', schema);