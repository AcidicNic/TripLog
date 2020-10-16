const express = require('express');
const router = express.Router();

const passport = require("passport");
const { body, validationResult } = require('express-validator');
const connectEnsureLogin = require('connect-ensure-login');

const User = require("../models/user");

router.get('/login', connectEnsureLogin.ensureLoggedOut(), (req, res) => {
    return res.render("login");
});

router.post('/login',
[
    body('username').isLength({ min: 3 }).withMessage('must be at least 3 chars long')
        .trim().escape(),
    body('password').isLength({ min: 8 }).withMessage('must be at least 8 chars long')
        .matches(/\d/).withMessage('must contain a number').trim().escape(),
],
 (req, res, next) => {
    passport.authenticate('local',
    (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login?info=' + info); }

        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }

            return res.redirect('/');
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    return res.redirect('/');
});

router.get("/signup", connectEnsureLogin.ensureLoggedOut(), (req, res) => {
    return res.render("signup");
});

router.post('/signup', (req, res) => {
    User.register(
        { username: req.body.username, active: true },
        req.body.password
    );
    return res.redirect('/');
});

module.exports = router;
