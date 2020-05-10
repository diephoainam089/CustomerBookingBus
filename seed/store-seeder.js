var Store = require('../models/store');
var mongoose = require('mongoose');
const mongo = mongoose.connect('mongodb://localhost:27017/Booking_BusTicket_Project', {
  useNewUrlParser: true
});
mongo.then(() => {
    console.log('connected');
    }).catch((err) => {
    console.log('err', err);
    });
var stores = [
    new Store({
        storeName: 'COZA',
        address: '01 Yersin, district 1, HCM city, Viet Nam',
        phoneNum: '+84 1233192939',
        email: 'coza@gmail.com',
        description: 'This is a company provide about fashion clothes.',
        logoImage: 'logo-01.png',
        imageGroup: []
    })
];
var done = 0;
for(var i = 0 ; i< stores.length; i++){
    stores[i].save(function(err,result){
        done++;
        if(done == stores.length){
            exit();
        }
    });
}
function exit(){
    mongoose.disconnect();
}