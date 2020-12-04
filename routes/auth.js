require('dotenv').config();
const express = require('express');
const router = express.Router();

const passport = require("passport");
const { check, validationResult } = require('express-validator');
const connectEnsureLogin = require('connect-ensure-login');
const mailgun = require('mailgun-js')({apiKey: process.env.MG_API_KEY, domain: "mg.triplog.xyz"});
const crypto = require("crypto");

const User = require("../models/user");
const Verify = require("../models/verify");

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
    User.register({ name: req.body.name, email: req.body.email, active: true }, req.body.password, function(err, user) {
        const code = crypto.randomBytes(25).toString('hex');
        const verifyEmail = new Verify({ email: req.body.email, code: code });
        verifyEmail.save().then( (err, verify) => {
            let htmlBody = `<h4>Hello, ${req.body.name}. Welcome to Triplog!</h4><p>If you didn't recently create a TripLog account, ignore this.</p><p>Otherwise, you can <a href="http://www.triplog.xyz/verify?code=${code}">click here</a> to verify your account.</p><p>I value your time and privacy, so you won't receive any unsolicited emails after this and your data will be kept safe.</p><p>Thank you for signing up! Wishing you a safe and fun trip filled with good vibes <3</p><p>(Please don't reply to this message, no one will see it!)</p>`;
            let textBody = `Hello, ${req.body.name}. Welcome to Triplog!
If you didn't recently create a TripLog account, ignore this.
Otherwise, you can visit http://www.triplog.xyz/verify?code=${code} to verify your account.
I value your time and privacy, so you won't receive any unsolicited emails after this and your data will be kept safe.
Thank you for signing up! Wishing you a safe and fun trip filled with good vibes <3
(Please don't reply to this message, no one will see it!)`
            if (!req.body.name) {
                htmlBody = `<h4>Welcome to Triplog!</h4><p>If you didn't recently create a TripLog account, ignore this.</p><p>Otherwise, you can <a href="http://www.triplog.xyz/verify?code=${code}">click here</a> to verify your account.</p><p>I value your time and privacy, so you won't receive any unsolicited emails after this and your data will be kept safe.</p><p>Thank you for signing up! Wishing you a safe and fun trip filled with good vibes <3</p><p>(Please don't reply to this message, no one will see it!)</p>`
                textBody = `Welcome to Triplog!
If you didn't recently create a TripLog account, ignore this.
Otherwise, you can visit http://www.triplog.xyz/verify?code=${code} to verify your account.
I value your time and privacy, so you won't receive any unsolicited emails after this and your data will be kept safe.
Thank you for signing up! Wishing you a safe and fun trip filled with good vibes <3
(Please don't reply to this message, no one will see it!)`
            }
            const data = {
                from: 'TripLog <hello@mg.triplog.xyz>',
                to: req.body.email,
                subject: 'Please confirm your email for TripLog.',
                text: textBody,
                html: htmlBody,
                "h:List-Unsubscribe": `<mailto: unsubscribe@triplog.xyz?subject=unsubscribe>, <http://www.triplog.xyz/unsubscribe?code=${code}>`,
                "h:Reply-To" : "nicc@triplog.xyz"
            };
            mailgun.messages().send(data, (err, body) => {
                console.log(body);
                return res.render("login", { email: req.body.email, msgs: ["Sign up successful. :) Don't forget to verify your email!"] });
            });
            passport.authenticate('local', (err, user, info) => {
                if (err) { return next(err); }
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
            });
        });
    });
});

router.get('/verify', (req, res) => {
    try {
        const code = req.query.code;
        Verify.findOne({ code: code }, function(err, verify) {
            if (verify) {
                User.findOne({ email: verify.email }, function(err, user) {
                    if (err) {
                        return res.redirect(`/?msg=Error while verifying email!`);
                    }
                    if (user) {
                        User.updateOne({ email: verify.email }, { verified: true }).then( (err, user) => {
                            Verify.deleteOne({ _id: verify })
                            .then( (err, verify) => {
                                if (err) {
                                    return res.redirect(`/?msg=Error while verifying email!`);
                                }
                                return res.redirect(`/?msg=Your email has been verified!`);
                            });
                        });
                    }
                });
            };
        });
    } catch (err) {
        return res.redirect(`/?msg=Error while verifying email!`);
    }
});

module.exports = router;
