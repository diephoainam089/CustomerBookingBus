var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars');
var userRouter = require('./routes/user');
var mongoose = require('mongoose');
var session = require('express-session')
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var bodyParser = require('body-parser')
var productRouter = require('./routes/product')
var cartRouter = require('./routes/cart')
var orderRouter = require('./routes/order')
var indexRouter = require('./routes/index');
var contactRouter = require('./routes/contact')
var i18n = require('i18n')
const passportSetup = require('./config/passport-gmail')
const paypal = require('paypal-rest-sdk')


var app = express();

mongoose.connect('mongodb://localhost:27017/Booking_BusTicket_Project', {
  useNewUrlParser: true
});
require('./config/passport')
// view engine setup
app.engine('.hbs', expressHbs({
  defaultLayout: 'layout',
  extname: '.hbs',
  helpers: {
    __: function() { return i18n.__.apply(this, arguments); },
    __n: function() { return i18n.__n.apply(this, arguments); }
  }
}))
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(validator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));



app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
})

i18n.configure({
  locales: ['vn', 'en'],
  fallbacks: {'en': 'vn'},
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  directory: __dirname + '/locales',
  directoryPermissions: '755',
  autoReload: true,
  updateFiles: true,
  api: {
    '__': '__',  //now req.__ becomes req.__
    '__n': '__n' //and req.__n can be called as req.__n
  }
});

// Config paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'Ac2CpvEiscaau066dpiglka05SSz0OxXkI_aodtTclhxjpeLZCapOS2vxQLjmast4TQT6-MzvvM3sh4H',
  'client_secret': 'EGoSxdhK65yWz6jUmbFykJil_VZhfAuTN946k3M2p-dXY43vRgrI4x5lLt2kMNyjiGvwfWMgsjV2lwbX'
});

app.use(i18n.init);

app.get('/vn', function (req, res) {
  res.cookie('locale', 'vn', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});
// http://127.0.0.1:3000/en
app.get('/en', function (req, res) {
  res.cookie('locale', 'en', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

app.use('/user', userRouter)
app.use('/product', productRouter)
app.use('/cart', cartRouter)
app.use('/order', orderRouter)
app.use('/contact', contactRouter)
app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404;
  next(err);
  //next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;