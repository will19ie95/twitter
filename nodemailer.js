const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "no.reply.twitterClone",
    pass: "will19ie95"
  }
});

// setup e-mail data with unicode symbols
var mailOptions = {
  from: 'Twitter Clone👻 <no.reply.twitterClone@gmail.com>', // sender address
  to: 'no.reply.twitterClone@gmail.com', // list of receivers
  subject: 'Hello ✔', // Subject line
  text: 'Hello world ?', // plaintext body
  html: '<b>Hello world ?</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
    return console.log(error);
  }
  console.log('Message sent: ' + info.response);
});