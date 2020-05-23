var express = require('express')
var router = express.Router()
var Product = require('../models/product')
var User = require('../models/user')
var csrf = require('csurf')
var passport = require('passport')
var csurfProtection = csrf()
var checkAuthen = require('../config/checkAuthenticate')

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
)

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  req.session.user = req.user
  console.log(req.user)
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl
    req.session.oldUrl = null
    console.log(oldUrl)
    res.redirect(oldUrl)
  } else {
    res.redirect('./profile')
  }
})

router.post('/update/:email', (req, res) => {
  User.findOneAndUpdate(
    {
      email: req.params.email
    },
    {
      $set: {
        fullName: req.body.fullName,
        birthday: req.body.birthday,
        company: req.body.company,
        phoneNum: req.body.phoneNum,
        address: req.body.address,
        description: req.body.description
      }
    },
    {
      upsert: true,
      new: true
    },
    async (err, doc) => {
      if (doc.orderList.length > 0) {
        await Product.updateMany(
          {
            'orderList.userInfo.email': doc.email
          },
          {
            $set: {
              'orderList.$.userInfo.name': req.body.fullName,
              'orderList.$.userInfo.phoneNum': req.body.phoneNum,
              'orderList.$.userInfo.address': req.body.address
            }
          },
          {
            upsert: true,
            new: true
          },
          (errs, rs) => {}
        )
      }

      await res.redirect('./user/profile')
    }
  )
})

router.post('/viewDetail', checkAuthen.isLoggedIn, (req, res) => {
  User.findOne(
    {
      email: req.body.email,
      role: 'Customer'
    },
    async (err, user) => {
      await Product.find(async (err, product) => {
        var arrProduct = [],
          arr_proDelet = []
        var obj = {
          orderList: []
        }
        if (user.orderList.length > 0) {
          await user.orderList.forEach(s => {
            if (s.number == Number(req.body.numberOrder)) {
              obj.totalPrice = s.totalPrice
              obj.orderDate = s.orderDate
              s.sub_order.forEach(x => {
                product.forEach(pro => {
                  if (x.proId == pro._id) {
                    x.orderNumber.forEach(o => {
                      pro.orderList.forEach(p => {
                        if (o == p.numberOrder) {
                          p.departure = pro.title
                          p.destination = pro.to
                          p.departDate = pro.departDate
                          p.codeBus = pro.codeBus
                          arrProduct.push(p) // view product detail
                          // setup delete product
                          var proDelete = {
                            _id: pro._id,
                            numberOrder: p.numberOrder
                          }
                          arr_proDelet.push(proDelete)
                        }
                      })
                    })
                  }
                })
              })
            }
          })
          obj.userInfo = await arrProduct[0].userInfo
          obj.couponCode = await arrProduct[0].couponCode
          obj.orderList = await arrProduct
        }
        await res.render('user/orderDetail', {
          orderDetail: obj,
          arr_proDelet: JSON.stringify(arr_proDelet)
        })
      })
    }
  )
})

router.post('/deleteOrder', async (req, res) => {
  var arr_proDelet = JSON.parse(req.body.arrPro)
  arr_proDelet.forEach(pro => {
    var updPro = Product.findOneAndUpdate(
      {
        _id: pro._id,
        'orderList.numberOrder': pro.numberOrder
      },
      {
        $set: {
          'orderList.$.status': -1
        }
      },
      {
        upsert: true,
        new: true
      },
      async (err, docs) => {}
    )
  })
  res.redirect('./profile')
})

router.get('/traveled-trip', checkAuthen.isLoggedIn, async (req, res) => {
  var user = req.session.user
  // console.log(user)

  // Product.find(async (err, trips) => {
  //   // console.log(trips, 'Mảng')
  //   let userTrips = []
  //   trips.forEach(async trip => {
  //     var userTrip = trip.orderList.filter(o => o.userInfo.email == user.email)
  //     userTrips = userTrips.concat(userTrip)
  //   })
  //   console.log(userTrips)
  //   await res.render('user/traveledTrip', {
  //     traveled: 'Hello'
  //   })
  // })

  User.findOne(
    {
      email: user.email
    },
    (err, doc) => {
      var birthday = ''
      if (doc.birthday != null) {
        birthday = doc.birthday.toISOString().slice(0, 10)
      }
      Product.find((err, pro) => {
        var userTrips = []
        var userTrips_valid = []
        doc.orderList.forEach(s => {
          // var check = true
          s.sub_order.forEach(x => {
            pro.forEach(p => {
              if (x.proId == p._id) {
                p.orderList.forEach(o => {
                  x.orderNumber.forEach(ord => {
                    if (
                      (ord == o.numberOrder && o.status === 1 )  
                    ) {
                    var obj_orders = {}
                      obj_orders.orderDate = s.orderDate
                      obj_orders.number = s.number
                      obj_orders.tripId = p._id
                      obj_orders.title = p.title
                      obj_orders.to = p.to
                      obj_orders.image = p.imagePath
                      obj_orders.codeBus = p.codeBus
                      obj_orders.departDate = p.departDate
                      obj_orders.departHour = p.departTime.hour 
                      obj_orders.departMinute = p.departTime.minute 
                      obj_orders.quantity = o.seats.length
                      obj_orders.seatCode = o.seats
                      obj_orders.price = o.totalHasDiscount
                      obj_orders.email = doc.email
                      userTrips.push(obj_orders)
                      var dataNow = new Date()
                      userTrips_valid = userTrips.filter(
                        t =>
                          Number(dataNow.getDate()) -
                            Number(t.departDate.toISOString().slice(8, 10)) <=
                          4
                      )
                    }
                    // if (check == true) {
                    //   // setup view order list by date
                      
                    //   // end setup view order list by date
                    //   // console.log(Number(Date.now()) - Number(.departDate));
                    //   console.log(userTrips);
                    //   // console.log(userTrips_valid, 'aaaa')
                    //   // console.log(dataNow.getDate()) 
                    // }
                  })
                })
              }
            })
          })
        })
        res.render('user/traveledTrip', {
          users: doc,
          orderList: userTrips_valid,
          birthday: birthday
        })
      })
    }
  )
})

router.use(csurfProtection)

router.get('/profile', checkAuthen.isLoggedIn, function (req, res, next) {
  var user = req.session.user
  User.findOne(
    {
      email: user.email
    },
    (err, doc) => {
      var birthday = ''
      if (doc.birthday != null) {
        birthday = doc.birthday.toISOString().slice(0, 10)
      }
      Product.find((err, pro) => {
        var orderList_user = []
        doc.orderList.forEach(s => {
          var check = true
          s.sub_order.forEach(x => {
            pro.forEach(p => {
              if (x.proId == p._id) {
                p.orderList.forEach(o => {
                  x.orderNumber.forEach(ord => {
                    if (ord == o.numberOrder && o.status != 0) {
                      check = false
                    }
                  })
                })
              }
            })
          })
          if (check == true) {
            // setup view order list by date
            var obj_orders = {}
            obj_orders.orderDate = s.orderDate
            obj_orders.number = s.number
            obj_orders.email = doc.email
            orderList_user.push(obj_orders)
            // end setup view order list by date
          }
        })
        res.render('user/profile', {
          users: doc,
          orderList: orderList_user,
          birthday: birthday
        })
      })
    }
  )
})

router.get('/logout', checkAuthen.isLoggedIn, function (req, res, next) {
  req.logOut()
  req.session.user = null
  res.redirect('/')
})

router.use('/', checkAuthen.notLoggedIn, function (req, res, next) {
  next()
})

router.get('/signup', function (req, res, next) {
  var messages = req.flash('error')
  res.render('user/signup', {
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0
  })
})
router.post(
  '/signup',
  passport.authenticate('local.signup', {
    failureRedirect: './signup',
    failureFlash: true
  }),
  function (req, res, next) {
    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl
      req.session.oldUrl = null
      res.redirect(oldUrl)
    } else {
      res.redirect('./profile')
    }
  }
)

router.get('/signin', function (req, res, next) {
  var messages = req.flash('error')
  res.render('user/signin', {
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0
  })
})

router.post(
  '/signin',
  passport.authenticate('local.signin', {
    failureRedirect: './signin',
    failureFlash: true
  }),
  function (req, res, next) {
    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl
      req.session.oldUrl = null
      res.redirect(oldUrl)
    } else {
      res.redirect('./profile')
    }
  }
)

module.exports = router
