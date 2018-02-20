
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://booking:booking@ds041678.mlab.com:41678/booking', (err, client) => {
  if (err) throw err;

  const db = client.db('booking');

  const express = require('express');
  const app = express();
  const bodyParser = require('body-parser');
  const email = require('./email');

  const api_key = 'key-1b2ba253282e03f0b699b2940ad638d2';
  const domain = 'mg.startincle.com';
  const from_who = 'getinvolved@startincle.com';

  const prod = process.env.NODE_ENV === 'production';
  const port = prod ? 443 : 3030;
  var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

  app.use(bodyParser.json());

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", prod ? "startincle.com" : "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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

  app.listen(port, () => console.log(`App listening on port ${port}!`))
});
