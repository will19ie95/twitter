exports.logErrors = function (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

exports.clientErrorHandler = function (err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' })
  } else {
    next(err)
  }
}

exports.errorHandler = function (err, req, res, next) {
  return res.status(500).json({
    status: "error",
    error: err.message
  })
}