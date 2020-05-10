var coupon = require('../models/coupon');
var mongoose = require('mongoose');
const mongo = mongoose.connect('mongodb://localhost:27017/Booking_BusTicket_Project', {
  useNewUrlParser: true
});
mongo.then(() => {
    console.log('connected');
}).catch((err) => {
    console.log('err', err);
});
var coupons = [
    new coupon({
        discount: 0.05,
        description: '5 %',
        active: true,
    }),
    new coupon({
        discount: 0.1,
        description: '10 %',
        active: true,
    }),
];
var done = 0;
for (var i = 0; i < coupons.length; i++) {
    coupons[i].save(function (err, result) {
        done++;
        if (done == coupons.length) {
            exit();
        }
    });
}
function exit() {
    mongoose.disconnect();
}