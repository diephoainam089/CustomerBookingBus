var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schema = new Schema({
    discount: {type: Number, required: true},
    description: {type: String},
    active: {type:Boolean,require:true}
})
module.exports = mongoose.model('Coupon',schema);