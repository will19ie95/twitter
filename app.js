const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('./passport');
const db = require('./db');
const secret = require("./secret");

const index = require('./routes/index');
const users = require('./routes/users');
const errorHandlers = require("./errorHandlers");

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// logger
app.use(logger('dev'));

// enable cross origin requests
app.use(cors());
app.options('*', cors()) // include before other routes

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', index);
app.use('/api', users);

app.use(errorHandlers.logErrors)
app.use(errorHandlers.clientErrorHandler)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
