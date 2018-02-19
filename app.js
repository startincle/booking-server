const express = require('express');
const app = express();

const api_key = 'key-1b2ba253282e03f0b699b2940ad638d2';
const domain = 'mg.startincle.com';
const from_who = 'info@startincle.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "startincle.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/submit/:mail', (req, res) => {
  const data = {
    from: from_who,
    to: req.params.mail,
    subject: 'Hello from Mailgun',
    html: 'Hello, This is not a plain-text email, I wanted to test some spicy Mailgun sauce in NodeJS! <a href="http://0.0.0.0:3030/validate?' + req.params.mail + '">Click here to add your email address to a mailing list</a>'
  };

  mailgun.messages().send(data, (err, body) => {
    if (err) {
      console.log("got an error: ", err);
    } else {
      console.log(body);
    }
  });

  return res.send('Email Sent!')
});

app.listen(443, () => console.log('App listening on port 443!'))
// app.listen(3030, () => console.log(mailgun));
