var express = require('express')
var router = express.Router()
var Product = require('../models/product')
var Cart = require('../models/cart')
var Coupon = require('../models/coupon')
/* GET home page. */

router.post('/add-to-cart/:id', function (req, res, next) {
  // console.log(req.body.test, typeof(req.body.test));
  if (req.body.seat === undefined) {
    return res.redirect(`/product/detail/${req.params.id}`)
  } else {
    var seats = req.body.seat
    console.log(seats)
    var arrSeats = []
    // req.session.seats =  ? seats : arrSeats.push(seats)
    if(Array.isArray(seats)){
      arrSeats = seats
      req.session.seats = seats
    }else{
      arrSeats.push(seats)
      req.session.seats = arrSeats
    }
    var productId = req.params.id
    var qty = req.session.seats.length
    var size = req.body.size
    var seatCode = req.session.seats
    var cart = new Cart({})
    Product.findById(productId, function (err, product) {
      if (err) {
        return res.redirect('/')
      }
      cart.add(product, product.id, qty, size, seatCode)
      req.session.cart = cart
      // console.log(cart)
      res.redirect('/cart/shopping-cart')
    })
  }
})

router.get('/shopping-cart', function (req, res, next) {
  if (!req.session.cart) {
    return res.render('cart/shopping-cart', {
      products: null
    })
  }
  var cart = new Cart(req.session.cart)
  console.log(cart.generateArray())
  var saleCodeId = req.query.couponCode
  Coupon.findOne(
    {
      _id: saleCodeId
    },
    (err, doc) => {
      if (doc && doc.active == true) {
        req.session.cart.coupons = doc
        cart.coupons = doc
        cart.totalDiscount = (cart.totalPrice - cart.totalPrice * doc.discount).toFixed(1)
        req.session.cart.totalDiscount = cart.totalDiscount
      } else if (doc && doc.active == false) {
        req.session.cart.coupons = {
          description: 0,
          discount: 0
        }
        cart.coupons = {
          description: 0,
          discount: 0
        }
        var show_messages = 'This sale code was not active!'
      } else if (!doc) {
        req.session.cart.coupons = {
          description: 0,
          discount: 0
        }
        cart.coupons = {
          description: 0,
          discount: 0
        }
        cart.totalDiscount = cart.totalPrice
        req.session.cart.totalDiscount = cart.totalDiscount
        if (saleCodeId) {
          var show_messages = 'The sale code invalid!'
        }
      }
      res.render('cart/shopping-cart', {
        products: cart.generateArray(),
        totalPrice: cart.totalPrice,
        couponCodes: cart.coupons,
        priceDiscount: cart.totalDiscount,
        messages: show_messages
      })
    }
  )
})

router.get('/removeAll/:id', function (req, res, next) {
  var productId = req.params.id
  var cart = new Cart(req.session.cart ? req.session.cart : {})
  cart.removeItem(productId)
  req.session.cart = cart
  req.session.seats = []
  res.redirect('/cart/shopping-cart')
})
router.get('/reduceByOne/:id', (req, res) => {
  var productId = req.params.id
  var cart = new Cart(req.session.cart ? req.session.cart : {})
  cart.reduceByOne(productId)
  req.session.cart = cart
  res.redirect('/cart/shopping-cart')
})

module.exports = router
