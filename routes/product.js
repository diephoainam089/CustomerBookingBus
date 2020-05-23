var express = require('express')
var router = express.Router()
var Product = require('../models/product')
var paginate = require('../config/paginate')
var { FormatPrice } = require('../config/formatNum')
var sizes = 2
/* GET home page. */

router.get('/product-more', async (req, res) => {
  if (req.session.cart || req.session.seats) {
    delete req.session.cart
    delete req.session.seats
  }
  sizes = await (sizes + 2)
  await Product.paginate(
    {},
    {
      page: 1,
      limit: sizes
    },
    async function (err, rs) {
      var docs = rs.docs
      var productChunks = []
      var uniqueDepart = []
      var uniqueDestina = []
      if (sizes > docs.length) {
        sizes = docs.length
        var hiddenMore = true
      }
      var chuckSize = 4
      for (var i = 0; i < docs.length; i += chuckSize) {
        productChunks.push(docs.slice(i, i + chuckSize))
      }
      for (let i = 0; i < productChunks.length; i++) {
        productChunks[i].sort((a, b) => {
          return a.price - b.price
        })
      }
      Product.find(async (err, tr) => {
        var departList = []
        var destinaList = []
        var tripArr = []
        var tripChunks = []
        for (var i = 0; i < tr.length; i++) {
          await departList.push(tr[i].title)
          await destinaList.push(tr[i].to)
          tr[i].price = FormatPrice(tr[i].price)
          tripArr.push(tr[i])
        }
        tripChunks.push(tripArr)
        uniqueDepart = Array.from(new Set(departList))
        uniqueDestina = Array.from(new Set(destinaList))
        uniqueDepart.sort()
        uniqueDestina.sort()

        // Set tripChunks arr to req.app.locals to infuse another routes
        req.app.locals.FilterTripArr = await tripChunks
        req.app.locals.FilterSeatTripArr = await tripChunks
        await res.render('product/productList', {
          products: productChunks,
          departures: uniqueDepart,
          destinations: uniqueDestina,
          hiddenMore: hiddenMore
        })
      })

      console.log(productChunks)
    }
  )

  // Product.find(async (err, docs) => {
  //     if (sizes >= docs.length) {
  //         sizes = docs.length
  //         var hidenMore = true;
  //     }
  //     var productChunks = [];
  //     productChunks = await paginate(1, sizes)
  //     await res.render('product/productList', {
  //         products: productChunks,
  //         hidenMore: hidenMore
  //     });

  // })
})

router.post('/product-search', async (req, res) => {
  var a = new Date()
  console.log(a.getDate())
  if (req.session.cart || req.session.seats) {
    delete req.session.cart
    delete req.session.seats
  }
  console.log(typeof req.body.departDate)
  Product.find(
    {
      title: {
        $regex: req.body.departure,
        $options: 'i'
      },
      to: {
        $regex: req.body.destination,
        $options: 'i'
      }
    },
    async (err, docs) => {
      var arrTripByDate = docs.filter(
        s =>
          req.body.departDate &&
          s.departDate.toISOString().slice(0, 10) === req.body.departDate &&
          s
      )

      //console.log(arrTripByDate)
      // console.log(docs)
      var departList = []
      var destinaList = []
      var tripChunks = []
      var chunkSize = arrTripByDate.length
      var hiddenMore = true
      if (arrTripByDate.length == 0) {
        var emptyList = true
      }
      for (var i = 0; i < arrTripByDate.length; i += chunkSize) {
        tripChunks.push(arrTripByDate.slice(i, i + chunkSize))
      }

      Product.find(async (err, rs) => {
        let uniqueDepart = []
        let uniqueDestina = []
        for (let i = 0; i < rs.length; i++) {
          await uniqueDepart.push(rs[i].title)
          await uniqueDestina.push(rs[i].to)
        }

        departList = Array.from(new Set(uniqueDepart)).sort()
        destinaList = Array.from(new Set(uniqueDestina)).sort()
        // Set tripChunks arr to req.app.locals to infuse another routes
        req.app.locals.FilterTripArr = await tripChunks
        req.app.locals.SortTripArr = await tripChunks
        req.app.locals.FilterSeatTripArr = await tripChunks

        await res.render('product/productList', {
          products: tripChunks,
          departures: departList,
          destinations: destinaList,
          emptyList: emptyList,
          hiddenMore: hiddenMore
        })
      })
    }
  )
})

router.post('/filterPrice', async (req, res) => {
  // Get req.app.locals = tripArr
  let tripArr = req.app.locals.FilterTripArr
  let tripChunks = []
  let filtered_Arr = []
  let departList = []
  let destinaList = []
  Product.find(async (err, rs) => {
    let uniqueDepart = []
    let uniqueDestina = []
    for (let i = 0; i < rs.length; i++) {
      await uniqueDepart.push(rs[i].title)
      await uniqueDestina.push(rs[i].to)
    }

    departList = Array.from(new Set(uniqueDepart)).sort()
    destinaList = Array.from(new Set(uniqueDestina)).sort()

    //console.log(tripArr[0])
    for (let i = 0; i < tripArr.length; i++) {
      tripArr[i].forEach(t => {
        if (
          t.price >= Number(req.body.min) &&
          t.price <= Number(req.body.max)
        ) {
          return filtered_Arr.push(t)
        }
      })
    }
    console.log(filtered_Arr.length)
    if (filtered_Arr.length == 0) {
      var emptyList = true
    }
    let chunkSize = filtered_Arr.length
    let hiddenMore = true
    for (let i = 0; i < filtered_Arr.length; i += chunkSize) {
      tripChunks.push(filtered_Arr.slice(i, i + chunkSize))
    }
    console.log(tripChunks)
    // Set tripChunks arr to req.app.locals to infuse another routes
    req.app.locals.SortTripArr = await tripChunks
    req.app.locals.FilterSeatTripArr = await tripChunks
    res.render('product/productList', {
      products: tripChunks,
      departures: departList,
      destinations: destinaList,
      emptyList: emptyList,
      hiddenMore: hiddenMore
    })
  })
})

router.post('/filterSeat', (req, res) => {
  let tripArr = req.app.locals.FilterSeatTripArr
  let tripChunks = []
  let filtered_Arr = []
  let departList = []
  let destinaList = []

  Product.find(async (err, rs) => {
    let uniqueDepart = []
    let uniqueDestina = []
    for (let i = 0; i < rs.length; i++) {
      await uniqueDepart.push(rs[i].title)
      await uniqueDestina.push(rs[i].to)
    }

    departList = Array.from(new Set(uniqueDepart)).sort()
    destinaList = Array.from(new Set(uniqueDestina)).sort()
    for (let i = 0; i < tripArr.length; i++) {
      tripArr[i].forEach(t => {
        if (
          t.seats >= Number(req.body.minSeat) &&
          t.seats <= Number(req.body.maxSeat)
        ) {
          return filtered_Arr.push(t)
        }
      })
    }
    if (filtered_Arr.length == 0) {
      var emptyList = true
    }
    let chunkSize = filtered_Arr.length
    let hiddenMore = true
    for (let i = 0; i < filtered_Arr.length; i += chunkSize) {
      tripChunks.push(filtered_Arr.slice(i, i + chunkSize))
    }
    console.log(tripChunks, 'abcd')
    res.render('product/productList', {
      departures: departList,
      destinations: destinaList,
      products: tripChunks,
      emptyList: emptyList,
      hiddenMore: hiddenMore
    })
  })
})

router.get('/:id', async (req, res, next) => {
  let key = req.params.id
  let tripArr = req.app.locals.SortTripArr
  let tripChunks = []
  let sorted_Arr = []
  let hiddenMore = true
  for (let i = 0; i < tripArr.length; i++) {
    if (key == 'increaseP') {
      await tripArr[i].sort((a, b) => {
        return a.price - b.price
      })
    }
    if (key == 'decreaseP') {
      await tripArr[i].sort((a, b) => {
        return b.price - a.price
      })
    }
    if (key == 'earliest') {
      await tripArr[i].sort((a, b) => {
        if (a.departTime.hour !== b.departTime.hour) {
          if (a.departTime.hour < b.departTime.hour) return -1
          if (a.departTime.hour > b.departTime.hour) return 1
        } else {
          if (a.departTime.minute < b.departTime.minute) return -1
          if (a.departTime.minute > b.departTime.minute) return 1
        }
      })
    }
    if (key == 'latest') {
      await tripArr[i].sort((a, b) => {
        if (a.departTime.hour !== b.departTime.hour) {
          if (a.departTime.hour < b.departTime.hour) return 1
          if (a.departTime.hour > b.departTime.hour) return -1
        } else {
          if (a.departTime.minute < b.departTime.minute) return 1
          if (a.departTime.minute > b.departTime.minute) return -1
        }
        return 0
      })
    }
    sorted_Arr.push(tripArr[i])
  }

  // Set sorted_Arr to req.app.locals to infuse another routes
  req.app.locals.FilterTripArr = sorted_Arr

  res.render('product/productList', {
    products: sorted_Arr,
    hiddenMore: hiddenMore
  })
})

router.get('/detail/:id', (req, res, next) => {
  var productId = req.params.id
  var userAcc = req.session.user
  var checkReview = null
  var seat = [
    {
      id: 1,
      checked: ''
    },
    {
      id: 2,
      checked: ''
    },
    {
      id: 3,
      checked: ''
    },
    {
      id: 4,
      checked: ''
    },
    {
      id: 5,
      checked: ''
    },
    {
      id: 6,
      checked: ''
    },
    {
      id: 7,
      checked: ''
    },
    {
      id: 8,
      checked: ''
    },
    {
      id: 9,
      checked: ''
    },
    {
      id: 10,
      checked: ''
    },
    {
      id: 11,
      checked: ''
    },
    {
      id: 12,
      checked: ''
    }
  ]
  var seatChunks = []
  var seatSize = 4
  var arr = req.session.seats ? req.session.seats : []
  var Trip = Product.findById(productId, async (err, trip) => {
    if (err) {
      return res.redirect('/')
    }
    if (userAcc && trip.orderList.length > 0) {
      for (var i = 0; i < trip.orderList.length; i++) {
        if (
          trip.orderList[i].userInfo.email == userAcc.email &&
          trip.orderList[i].status == 1
        ) {
          checkReview = true
        }
      }
    }

    // set checked seat is choose
    arr.forEach(s => {
      seat.forEach(x => {
        if (Number(s) === x.id) {
          x.checked = 'checked'
        }
      })
    })

    // set disable seat is booked
    seat.forEach(s => {
      trip.seatIsBooked.forEach(x => {
        if (Number(x) === s.id) {
          s.checked = 'disabled'
        }
      })
    })

    // console.log(seat)

    for (var i = 0; i < seat.length; i += seatSize) {
      seatChunks.push(seat.slice(i, i + seatSize))
    }
    console.log(trip)
    await res.render('product/detail', {
      proDetail: trip,
      seatChunkSize: seatChunks,
      checkAcc: checkReview,
      reviewLength: trip.reviews.length
    })
  })
})

router.post('/review-product/:id', async (req, res) => {
  var id = req.params.id
  var rating = Number(req.body.rating)
  var userEmail = req.session.user.email
  var userName = req.session.user.fullName
  var description = req.body.review
  var productRate = 0
  var objReview = await {
    userEmail: userEmail,
    userName: userName,
    rating: rating,
    description: description,
    date_time: new Date().toISOString().slice(0, 10)
  }
  var ReviewUpd
  await Product.findById(id, async (err, doc) => {
    for (var i = 0; i < doc.reviews.length; i++) {
      if (doc.reviews[i].userEmail == userEmail) {
        // find userEmail exist
        ReviewUpd = await Product.findOneAndUpdate(
          {
            'reviews.userEmail': userEmail
          },
          {
            $set: {
              'reviews.$.userName': userName,
              'reviews.$.rating': rating,
              'reviews.$.description': description,
              'reviews.$.date_time': new Date().toISOString().slice(0, 10)
            }
          },
          {
            upsert: true,
            new: true
          },
          async (err, docs) => {}
        )
      }
    }
  })
  if (ReviewUpd == undefined) {
    await Product.findOneAndUpdate(
      {
        _id: id
      },
      {
        $addToSet: {
          reviews: objReview
        }
      },
      {
        new: true
      },
      async (err, doc) => {}
    )
  }
  await Product.findById(id, async (err, doc) => {
    var sum = 0
    var count = 0
    if (doc.reviews.length == 0) {
      count = 1
    }
    for (var i = 0; i < doc.reviews.length; i++) {
      sum = await (sum + doc.reviews[i].rating)
      await count++
    }
    productRate = await (sum / count).toFixed(1)
    await Product.findOneAndUpdate(
      {
        _id: id
      },
      {
        $set: {
          productRate: productRate
        }
      },
      {
        upsert: true,
        new: true
      },
      function (err, doc) {}
    )
  })
  res.redirect('../detail/' + id)
})



module.exports = router
