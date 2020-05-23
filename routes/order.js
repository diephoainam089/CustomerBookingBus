var express = require('express')
var router = express.Router()
var Product = require('../models/product')
var Cart = require('../models/cart')
var Coupon = require('../models/coupon')
var User = require('../models/user')
var sendMail = require('../config/sendMail')
var checkAuthen = require('../config/checkAuthenticate')
const paypal = require('paypal-rest-sdk')
/* GET home page. */

router.get('/check-out', checkAuthen.isLoggedIn, function (req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/cart/shopping-cart')
  }
  var cart = new Cart(req.session.cart)
  console.log(cart)
  res.render('order/checkout', {
    total: cart.totalPrice,
    infoUser: req.session.user,
    products: cart.generateArray(),
    discount: cart.coupons.description,
    totalDiscount: cart.totalDiscount
  })
})

router.post('/pay', async (req, res) => {
  if (!req.session.cart) {
  } else {
  }
  let cart = new Cart(req.session.cart)
  let trip = cart.generateArray()
  console.log(trip)
  console.log(cart)
  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: 'http://localhost:3000/order/success',
      cancel_url: 'http://localhost:3000/order/cancle'
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: `${trip[0].item.title} - ${trip[0].item.to}`,
              sku: `trip-${trip[0].item._id}`,
              price: `${trip[0].item.price}`,
              currency: 'USD',
              quantity: `${trip[0].qty}`
            },
            {
              name: `Discount ${cart.coupons.description}`,
              sku: 'discount',
              price: `-${(trip[0].price * cart.coupons.discount).toFixed(1)}`,
              currency: 'USD',
              quantity: '1'
            }
          ]
        },
        amount: {
          currency: 'USD',
          // total: cart.totalDiscount
          total: cart.totalDiscount
        },
        description: 'This is desc'
      }
    ]
  }
  // console.log(create_payment_json.transactions[0].item_list.items[0])
  // console.log(create_payment_json.transactions[0].item_list.items[1])
  // console.log(create_payment_json.transactions[0].amount)
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error
    } else {
      console.log(payment)
      // res.send('test')
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href)
        }
      }
    }
  })
})

router.get('/success', async (req, res) => {
  const payerId = req.query.PayerID
  const paymentId = req.query.paymentId
  let cart = new Cart(req.session.cart)
  let trip = cart.generateArray()
  let account = req.session.user
  console.log(req.session.user)
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: cart.totalDiscount
        }
      }
    ]
  }

  paypal.payment.execute(paymentId, execute_payment_json, async function (
    error,
    payment
  ) {
    if (error) {
      console.log(error.response)
      throw error
    } else {
      let infoTrip = `<table class="table">
  <thead>
  <tr>
    <th>Departure</th>
    <th>Destination</th>
    <th>Depart date</th>
    <th>Depart time</th>
    <th>Quantity</th>
    <th>Seat's code</th>
    <th>Bus's code</th>
    <th>Price</th>
    <th>Total Price</th>
  </tr>
  </thead>`
      let userInfo = payment.payer.payer_info
      let orderDate = new Date()
      let orderNumberOfUser = 0
      let numOrder = []
      let profit = 0
      let orderNumberOfTrip = 0
      let seatAvailable = trip[0].item.seats
      let seatBooked = trip[0].item.seatIsBooked
      let avbBook = true
      let ppTotalProfit = 0
      // create stt for order by payment online
      User.findOne({ email: account.email }, async (err, user) => {
        orderNumberOfUser = (await user.orderList.length) + 1
      })
      //console.log(orderNumberOfUser)

      await Product.findById(trip[0].item._id, async (err, rs) => {
        orderNumberOfTrip = (await rs.orderList.length) + 1
        seatAvailable = rs.seats - trip[0].seatCode.length
        // Set avbBook false if rs.seats == 0
        if (rs.seats - trip[0].seatCode.length == 0) {
          avbBook = false
        }
        trip[0].seatCode.forEach(s => {
          let existSeat = seatBooked.indexOf(s)
          if (existSeat == -1) {
            return seatBooked.push(s)
          }
        })
        // Set ppTotalProfit = rs.TotalProfit
        ppTotalProfit = rs.totalProfit + Number(cart.totalDiscount)
        console.log(cart)
        console.log(ppTotalProfit, '123')
        // set totalProfit and profit of trip
        if (cart.coupons.description == 0) {
          rs.totalProfit += trip[0].price
          profit = trip[0].price
        } else {
          rs.totalProfit +=
            trip[0].price - trip[0].price * cart.coupons.discount
          profit = trip[0].price - trip[0].price * cart.coupons.discount
        }

        // set sale code status
        console.log(cart.coupons)
        if (cart.coupons._id) {
          Coupon.findOneAndUpdate(
            { _id: cart.coupons._id },
            {
              $set: {
                active: false
              }
            },
            {
              upsert: true,
              new: true
            },
            (err, doc) => {}
          )
        }
      })
      var orderItem = {
        orderDate: orderDate,
        totalQuantity: trip[0].qty,
        totalPrice: trip[0].price,
        Size: trip[0].size,
        seats: trip[0].seatCode,
        departDate: trip[0].item.departDate,
        couponCode: cart.coupons,
        totalHasDiscount: profit, // change cart.totalDiscount
        statusShip: 'Not yet',
        userInfo: {
          name: account.fullName,
          email: account.email,
          phoneNum: account.phoneNum,
          address: account.address
        },
        status: 1,
        numberOrder: orderNumberOfTrip
      }
      // console.log(orderItem.userInfo)
      console.log(ppTotalProfit)
      await Product.findOneAndUpdate(
        {
          _id: trip[0].item._id
        },
        {
          $addToSet: {
            orderList: orderItem
          },
          $set: {
            seats: seatAvailable,
            seatIsBooked: seatBooked,
            availableBook: avbBook,
            totalProfit: ppTotalProfit
          }
        },
        async (err, doc) => {
          // create object to add sub_order each product id
          if (doc) {
            // console.log(doc)
            if (numOrder.length != 0) {
              var check = true
              await numOrder.forEach(s => {
                if (s.proId == trip[0].item._id) {
                  s.orderNumber.push(orderItem.numberOrder)
                  check = false
                }
              })
              if (check == true) {
                var obj = {
                  proId: trip[0].item._id,
                  orderNumber: []
                }
                await obj.orderNumber.push(orderItem.numberOrder)
                await numOrder.push(obj)
              }
            } else {
              var obj = {
                proId: trip[0].item._id,
                orderNumber: []
              }
              await obj.orderNumber.push(orderItem.numberOrder)
              await numOrder.push(obj)
            }
          }
          // End create object to add sub_order each product id
          // await console.log(numOrder)

          // create information of order to send mail
          infoTrip += `
          <tbody>
          <tr class="text-center">
            <td>${trip[0].item.title}</td>
            <td>${trip[0].item.to}</td>
            <td>${trip[0].item.departDate}</td>
            <td>${trip[0].item.departTime.hour}:${
            trip[0].item.departTime.minute
          }</td>
            <td>${trip[0].qty}</td>
            <td>${trip[0].seatCode}</td>
            <td>${trip[0].item.codeBus}</td>
            <td>${trip[0].item.price}</td>
            <td>${trip[0].qty * trip[0].item.price}</td>
          </tr>
          </tbody></table>
          </br>
          <h3>Total: $${cart.totalDiscount}</h3>
          <h4>When the trip is over, you can comment and rate the trip at the link: http://localhost:3000/product/detail/${
            trip[0].item._id
          }</h4>`
        }
      )
      await User.findOneAndUpdate(
        {
          email: account.email
        },
        {
          $addToSet: {
            orderList: {
              orderDate: orderDate,
              sub_order: numOrder,
              number: orderNumberOfUser,
              totalPrice: cart.totalDiscount
            }
          }
        }
      )
      let output =
        `<p>Dear ${account.fullName}</p></br>
                    <p>Thanks for choosing our service</p>
      ` + infoTrip
      await sendMail(output, 'Customer Order', account.email)
      if (req.session.cart || req.session.seats) {
        delete req.session.cart
        delete req.session.seats
      }
      res.redirect('../contact/notification')
    }
  })
})

router.get('/cancel', (req, res) => res.send('Cancelled'))

router.post('/add-order', async function (req, res, next) {
  var user = req.session.user // session for information of user
  var cart = new Cart(req.session.cart) // session for cart
  var cartArr = cart.generateArray() // parse to cart to array
  console.log(cartArr)
  // create table for information table
  let noteMessage = `<h4>When the trip is over, you can comment and rate the trip at the link:`
  let infoTrip = `<table class="table">
  <thead>
  <tr>
    <th>Departure</th>
    <th>Destination</th>
    <th>Depart date</th>
    <th>Depart time</th>
    <th>Quantity</th>
    <th>Seat's code</th>
    <th>Bus's code</th>
    <th>Price</th>
    <th>Total Price</th>
  </tr>
  </thead>`
  // end create table for information table

  var arrNum_order = []
  var orderDate = new Date() // create today to add orderDate
  // create stt for orderList in user-case
  var numberOrder_user = 0
  var user_find = await User.findOne(
    {
      email: user.email
    },
    async (err, users) => {
      numberOrder_user = (await users.orderList.length) + 1
    }
  )

  // end create stt for orderList in user-case

  for (var i = 0; i < cartArr.length; i++) {
    var profit = 0
    var NumberOrder = 0
    var seatAvailable = cartArr[i].item.seats
    var seatBooked = cartArr[i].item.seatIsBooked
    var avbBook = true
    await Product.findById(cartArr[i].item._id, async function (err, rs) {
      NumberOrder = (await rs.orderList.length) + 1
      // create stt for orderList in product
      seatAvailable = rs.seats - cartArr[i].seatCode.length
      cartArr[i].seatCode.forEach(s => {
        let existSeat = seatBooked.indexOf(s)
        if (existSeat == -1) {
          return seatBooked.push(s)
        }
      })
      if (rs.seats - cartArr[i].seatCode.length == 0) {
        avbBook = false
      }
      // process price after discount
      if (cart.coupons.description == 0) {
        rs.totalProfit += cartArr[i].price
        profit = cartArr[i].price
      } else {
        rs.totalProfit +=
          cartArr[i].price - cartArr[i].price * cart.coupons.discount
        profit = cartArr[i].price - cartArr[i].price * cart.coupons.discount
      }
      // view price after discount

      // set coupon code inActive
      if (cart.coupons._id) {
        Coupon.findOneAndUpdate(
          {
            _id: cart.coupons._id
          },
          {
            $set: {
              active: false
            }
          },
          {
            upsert: true,
            new: true
          },
          (err, doc) => {}
        )
      }
      // end set coupon code inActive
    })

    // create object to add into product -> orderList
    var orderItem = {
      orderDate: orderDate,
      totalQuantity: cartArr[i].qty,
      totalPrice: cartArr[i].price,
      Size: cartArr[i].size,
      seats: cartArr[i].seatCode,
      departDate: cartArr[i].item.departDate,
      couponCode: cart.coupons,
      totalHasDiscount: profit, // change cart.totalDiscount
      statusShip: 'Not yet',
      userInfo: {
        name: user.fullName,
        email: user.email,
        phoneNum: user.phoneNum,
        address: user.address
      },
      status: 0,
      numberOrder: NumberOrder
    }
    // end create object to add into product -> orderList
    //console.log(orderItem)
    // add subOrder to user -> orderList
    await Product.findOneAndUpdate(
      {
        _id: cartArr[i].item._id
      },
      {
        $addToSet: {
          orderList: orderItem
        },
        $set: {
          seats: seatAvailable,
          seatIsBooked: seatBooked,
          availableBook: avbBook
        }
      },
      async (err, doc) => {
        // create object to add sub_order each product id
        if (doc) {
          // console.log(doc, 'Đây là doc')
          if (arrNum_order.length != 0) {
            var check = true
            await arrNum_order.forEach(s => {
              if (s.proId == cartArr[i].item._id) {
                s.orderNumber.push(orderItem.numberOrder)
                check = false
              }
            })
            if (check == true) {
              var obj = {
                proId: cartArr[i].item._id,
                tripDate: cartArr[i].item.departDate,
                orderNumber: []
              }
              await obj.orderNumber.push(orderItem.numberOrder)
              await arrNum_order.push(obj)
            }
          } else {
            var obj = {
              proId: cartArr[i].item._id,
              tripDate: cartArr[i].item.departDate,
              orderNumber: []
            }
            await obj.orderNumber.push(orderItem.numberOrder)
            await arrNum_order.push(obj)
          }
        }
        // End create object to add sub_order each product id

        // create information of order to send mail
        infoTrip += `
        <tbody>
        <tr>
          <td>${cartArr[i].item.title}</td>
          <td>${cartArr[i].item.to}</td>
          <td>${cartArr[i].item.departDate}</td>
          <td>${cartArr[i].item.departTime.hour}:${
          cartArr[i].item.departTime.minute
        }</td>
          <td>${cartArr[i].qty}</td>
          <td>${cartArr[i].seatCode}</td>
          <td>${cartArr[i].item.codeBus}</td>
          <td>${cartArr[i].item.price}</td>
          <td>${cartArr[i].qty * cartArr[i].item.price}</td>
        </tr>`
        noteMessage += ` http://localhost:3000/product/detail/${cartArr[i].item._id}</h4>`
      }
    )
  }
  // add subOrder to user -> orderList
  var upd_user = await User.findOneAndUpdate(
    {
      email: user.email
    },
    {
      $addToSet: {
        orderList: {
          orderDate: orderDate,
          sub_order: arrNum_order,
          number: numberOrder_user,
          totalPrice: cart.totalDiscount
        }
      }
    },
    async (err, rs) => {}
  )
  // end add subOrder to user -> orderList

  // information to send mail
  var output =
    (await `
  <p>You have a new order</p>
  <h3>Contact Details</h3>
  <ul>
    <li>Name: ${user.fullName}.</li>
    <li>Email: ${user.email}.</li>
    <li>Order Date: ${new Date()}.</li>
    <li>Phone Number: ${user.phoneNum}.</li>
    <li>Address: ${user.address}</li>
    <li>Total Price Order:$ ${cart.totalPrice}.00</li>
    <li>Discount Order: ${cart.coupons.description}.</li>
    <li>Total Price:$ ${cart.totalDiscount}.</li>
  </ul>
`) +
    infoTrip +
    `</tbody></table>` +
    `<h3>Total:$ ${cart.totalDiscount}.00</h3>` +
    noteMessage
  // end send information to mail

  await sendMail(output, 'Customer Order', user.email)
  if (req.session.cart || req.session.seats) {
    delete req.session.cart
    delete req.session.seats
  } // delete session cart
  await res.render('contact/notification') // render page
})

module.exports = router
