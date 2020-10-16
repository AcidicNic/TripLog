const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const Log = require('../models/log');
const Dose = require('../models/dose');

/* Get create log page */
router.get('/begin', (req, res) => {
    return res.render("begin-form");
});

/* Post create log */
router.post('/create', [
    body('title').trim().escape(),
    body('desc').trim().escape(),
], (req, res) => {
    console.log(req.body);
    const tripping = req.body.tripping ? true : false;

    // create log
    const log = new Log({
        title: req.body.title,
        desc: req.body.desc,
        status: tripping,
    });

    log.save((err, log) => { if (err) throw err;
        var drugs = req.body.drug;
        var doses = req.body.dose;
        var units = req.body.unit;

        if (Array.isArray(req.body.drug)) {
            var doseArr = [];
            for (i = 0; i < drugs.length; i++) {
                doseArr.push(new Dose({
                    drug: drugs[i] , dose: doses[i], unit: units[i],
                }));
            }
            Dose.insertMany(doseArr, (err, doseArr) => {
                if (err) throw err;
                console.log(`DOSE ARR: ${doseArr}`)
                Log.updateOne(
                    { _id: log._id },
                    { $push: { doses: doseArr } },
                    (err, log) => { if (err) throw err; }
                );
            })
        } else {
            const dose = new Dose({
                drug: req.body.drug,
                dose: req.body.dose,
                unit: req.body.unit,
            });
            dose.save((err, dose) => {
                if (err) throw err;
                Log.updateOne(
                    { _id: log._id },
                    { $push: { doses: dose } },
                    (err, log) => { if (err) throw err; }
                );
                log.doses.push(dose._id);
            })
        }
        log.save((err, log) => { if (err) throw err; });
        console.log(log);
        return res.redirect(`/logs/${log._id}`);
        // TODO: add log to user.
    });
});

router.get('/logs/:id', (req, res) => {
    Log.findById(req.params.id)
    .populate('doses').populate('notes').lean()
    .then(log => {
        return res.render("log-show", { log });
    })
    .catch(err => {
        return res.redirect(`/`);
    });
});

module.exports = router;
