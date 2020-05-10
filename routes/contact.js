var express = require('express');
var router = express.Router();
var Store = require('../models/store')
var sendMail = require('../config/sendMail')


router.get('/view', function (req, res) {
    Store.find((err, docs) => {
        res.render('contact/contact', {
            store: docs
        })
    })

})

router.post('/sendMail', async (req, res) => {
    const output = await `
      <p>You have a new contact request.!</p>
      <h3>Contact Details</h3>
      <ul>
        <li>Email: ${req.body.email}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.msg}</p>
    `;
    await sendMail(output, "Customer Contact", "nhatnguyen00198@gmail.com")
    res.redirect('/contact/notification')
})

router.get('/about', (req, res) => {
    res.render('contact/about')
})

router.get('/notification', (req, res) => {
    res.render('contact/notification')
})
module.exports = router;