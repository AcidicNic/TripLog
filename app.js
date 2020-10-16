require('dotenv').config();
const port = process.env.PORT || 80;

const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const path = require('path');

const homeRouter = require('./routes/home.js');
const logRouter = require('./routes/log.js');

const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());

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

// pass thisUser to every template to every route
app.use(function(req, res, next) {
    res.locals.thisUser = req.user;
    next();
});

// Routes
app.use('/', homeRouter);
app.use('/', logRouter);

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });

module.exports = app;
