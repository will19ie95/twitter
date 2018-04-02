exports.logErrors = function (err, req, res, next) {
  console.error(err.stack)
  // console.log(err.message)
  next(err)
}

exports.clientErrorHandler = function (err, req, res, next) {
  return res.json({
    status: "error",
    error: err.message
  })
}