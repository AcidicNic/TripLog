const express = require('express');
const router = express.Router();

const passport = require("passport");
const { check, validationResult } = require('express-validator');
const connectEnsureLogin = require('connect-ensure-login');

const User = require("../models/user");

router.get('/login', connectEnsureLogin.ensureLoggedOut(), (req, res) => {
    return res.render("login");
});

router.post('/login', [
    check('email').exists()
        .isEmail().withMessage('be a valid email')
        .trim().escape(),
    check('password').exists()
        .isLength({ min: 8 }).withMessage('be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('contain an uppercase letter')
        .matches(/[a-z]/).withMessage('contain a lowercase letter')
        .matches(/\d/).withMessage('contain a number')
        .trim().escape(),
    ], (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
        return res.render("login", { email: req.body.email, errs: errs.array() });
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        console.log(user);
        console.log(info);
        console.log(err);
        if (!user) {
            return res.render("login", {
                email: req.body.email,
                errs: [{msg: "Incorrect email or password!"}]
            });
        }
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

router.post('/signup', [
    check('name').exists()
        .isLength({ min: 3 }).withMessage('be at least 3 characters long')
        .trim().escape(),
    check('email').exists()
        .isEmail().withMessage('be a valid email')
        .trim().escape(),
    check('password').exists()
        .isLength({ min: 8 }).withMessage('be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('contain an uppercase letter')
        .matches(/[a-z]/).withMessage('contain a lowercase letter')
        .matches(/\d/).withMessage('contain a number')
        .trim().escape() ], (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
        return res.render("signup", { email: req.body.email, name: req.body.name, errs: errs.array() });
    }
    User.register({ name: req.body.name, email: req.body.email, active: true }, req.body.password);
    return res.redirect('/');
});

module.exports = router;
