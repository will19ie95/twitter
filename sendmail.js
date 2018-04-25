var sendmail = require('sendmail')({
  smtpHost: 'localhost',
  smtpPort: 587
})


const sendMail = function (email, vToken) {
  sendmail({
    from: 'no-reply@yourdomain.com',
    to: email,
    subject: 'Testing sendmail',
    text: "validation key: <" + vToken + ">", // plaintext body
  }, function (err, reply) {
    console.log(err && err.stack)
    console.dir(reply)
  })
}

module.exports = {
  sendMail: sendMail
}