var mongoose = require('mongoose')
var mongoosePaginate = require('mongoose-paginate')
var Schema = mongoose.Schema
var schema = new Schema({
  imagePath: { type: String, required: true },
  title: { type: String, require: true },
  to: { type: String, require: true },
  codeBus: { type: String, require: true },
  description: { type: String, required: true },
  tripGroup: { type: String, required: true },
  price: { type: Number, required: true },
  departDate: { type: Date, default: Date.now() },
  departTime: { hour: String, minute: String },
  desTime: { type: String, require: true },
  seats: { type: Number, default: 12 },
  seatIsBooked: [],
  reviews: [],
  orderList: [],
  productRate: { type: Number },
  totalProfit: { type: Number },
  availableBook: { type: Boolean, default: true }
})
schema.plugin(mongoosePaginate)
module.exports = mongoose.model('Product', schema)
