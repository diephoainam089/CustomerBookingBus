var express = require('express')
var router = express.Router()
var Product = require('../models/product')
var paginate = require('../config/paginate')
var check_fields = require('../config/checkAuthenticate')
/* GET home page. */

router.get('/', async function (req, res, next) {
  if (req.session.cart) {
    delete req.session.cart
    delete req.session.seats
  }
  // var size = 8;
  // productChunks = await paginate(1, size)
  // await res.render('pages/index', {
  //   products: productChunks
  // });

  // top 8 product rating star
  // Product.find().sort({
  //   totalProfit: -1
  // }).limit(8).exec(async (err, rs) => {
  //   var productChunks = []
  //   var chunkSize = 4;
  //   for(var i = 0; i < rs.length; i += chunkSize){
  //     productChunks.push(rs.slice(i,i+chunkSize))
  //   }
  //   await res.render('pages/index',{
  //     products: productChunks
  //   })
  // })

  Product.find(async (err, docs) => {
    var departList = []
    var destinaList = []
    for (i = 0; i < docs.length; i++) {
      await departList.push(docs[i].title)
      await destinaList.push(docs[i].to)
    }
    var uniqueDepart = Array.from(new Set(departList))
    var uniqueDestina = Array.from(new Set(destinaList))
    uniqueDepart.sort()
    uniqueDestina.sort()
    res.render('pages/index', {
      departures: uniqueDepart,
      destinations: uniqueDestina
    })
  })
})

// router.post('/product-search', async (req, res) => {
//   if (req.session.cart) {
//     delete req.session.cart
//     delete req.session.seats
//   }
//   Product.find(
//     {
//       title: {
//         $regex: req.body.departure,
//         $options: 'i'
//       },
//       to: {
//         $regex: req.body.destination,
//         $options: 'i'
//       },
//       departDate: {
//         $gte: req.body.departDate
//       }
//     },
//     (err, docs) => {
//       var tripChunks = []
//       var chunkSize = docs.length
//       for (var i = 0; i < docs.length; i += chunkSize) {
//         tripChunks.push(docs.slice(i, i + chunkSize))
//       }
//       res.render('pages/index', {
//         products: tripChunks
//       })
//     }
//   )
// })

module.exports = router
