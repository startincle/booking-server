
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@ds041678.mlab.com:41678/booking', (err, client) => {
  if (err) throw err;

  const db = client.db('booking');

  const express = require('express');
  const app = express();
  const bodyParser = require('body-parser');
  const email = require('./email');

  const api_key = process.env.MAILGUN_API_KEY || 'key-1b2ba253282e03f0b699b2940ad638d2';
  const domain = process.env.MAILGUN_URL || 'sandbox0a4dc2baee1c402892bf2d516cf81c69.mailgun.org';
  const from_who = 'getinvolved@startincle.com';

  const prod = process.env.NODE_ENV === 'production';
  const port = prod ? 443 : 3030;
  var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

  app.use(bodyParser.json());

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
  });

  app.get('/', (req, res) => {
    const results = db.collection('mentors').find().toArray((err, result) => res.send(result));
  })

  app.post('/submit', (req, res) => {
    const selected = req.body.selected
      .map(value => `${value.name} - ${value.time}`)
      .reduce((a,b) => `${a}<br />`.concat(b));
      console.log(req.body.selected);
    const data = {
      from: from_who,
      to: req.body.email,
      subject: 'StartInCLE - Thanks for booking time with mentors!',
      html: email.html(selected),
    };

    mailgun.messages().send(data, (err, body) => {
      if (err) {
        console.log("got an error: ", err);
      } else {
        console.log(body);
      }
    });

    req.body.selected.forEach(value => {
      db.collection('mentors').findOne({'name': value.name}, (err, result) => {
        const slots = result.slots;
        slots[value.index] = req.body.email;
        db.collection('mentors').findOneAndUpdate(
          { 'name': value.name },
          { $set: { slots } },
        )
      });
    });

    return res.send('Email Sent!')
  });

  app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`))
});
