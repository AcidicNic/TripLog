require('dotenv').config();
const port = process.env.PORT || 80;

const express = require('express');
const hbs = require('express-handlebars');
const expressValidator = require('express-validator');
const path = require('path');

const homeRouter = require('./routes/home.js');
const logRouter = require('./routes/log.js');
const authRouter = require('./routes/auth.js');

const app = express();

const bodyParser = require('body-parser');
const expressSession = require('express-session')({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession);

app.use(express.json());

app.engine('hbs', hbs({
  extname: '.hbs',
  layoutDir: __dirname + '/views',
  partialsDir: __dirname + '/views/partials',
  defaultLayout: 'base',
}));
app.set('view engine', 'hbs');

app.use(express.static(path.normalize(path.join(__dirname, 'public'))));

// Database Setup
require('./data/db');

// Passport Setup
const User = require("./models/user");
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// pass thisUser to every template to every route
app.use(function(req, res, next) {
    res.locals.thisUser = req.user;
    next();
});

// Routes
app.use('/', homeRouter);
app.use('/', logRouter);
app.use('/', authRouter);

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });

module.exports = app;
