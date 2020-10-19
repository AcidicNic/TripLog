const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const connectEnsureLogin = require('connect-ensure-login');
const fetch = require("node-fetch");

const Log = require('../models/log');
const Dose = require('../models/dose');
const User = require('../models/user');
const Note = require('../models/note');

/* GET create log form */
router.get('/begin', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    return res.render('begin-form');
});

/* POST create log */
router.post('/create', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const tripping = req.body.tripping ? true : false;
    const log = new Log({
        title: req.body.title,
        desc: req.body.desc,
        status: tripping,
        owner: req.user._id,
    });
    log.save( async (err, log) => {
        if (err) throw err; // TODO

        if (!req.body.drug || !tripping) {
            const welcomeNote = new Note({
                content: `Welcome, ${req.user.name}!\nYou can use the dropdown menu on the top left to add a dose!`,
                format: "msgToUser",
            });
            welcomeNote.save( (err, note) => {
                if (err) throw err;
                Log.updateOne(
                    { _id: log._id },
                    { $push: { notes: note } },
                    (err, log) => { if (err) throw err; }
                );
            });
        } else if (Array.isArray(req.body.drug)) {
            var msgStr = ""
            var doseArr = [];
            for (i = 0; i < req.body.drug.length; i++) {
                prettyName = await getPrettyName(req.body.drug[i]);
                doseArr.push(new Dose({
                    drug: req.body.drug[i],
                    dose: req.body.dose[i],
                    unit: req.body.unit[i],
                    prettyName: await prettyName,
                }));
                msgStr += `\n${req.body.dose[i]}${req.body.unit[i]} of ${prettyName}`
            }
            Dose.insertMany(doseArr, (err, doseArr) => {
                if (err) throw err;

                const welcomeNote = new Note({
                    content: `Welcome, ${req.user.name}! So far you've had:${msgStr}`,
                    format: "msgToUser",
                });
                welcomeNote.save( (err, note) => {
                    if (err) throw err;
                    Log.updateOne(
                        { _id: log._id },
                        { $push: { notes: note, doses: doseArr } },
                        (err, log) => { if (err) throw err; }
                    );
                });
            })
        } else {
            try {
                var prettyName = await getPrettyName(req.body.drug);
            } catch (err) {
                var prettyName = null;
            }
            const dose = new Dose({
                drug: req.body.drug,
                dose: req.body.dose,
                unit: req.body.unit,
                prettyName: await prettyName,
            });
            dose.save((err, dose) => {
                const welcomeNote = new Note({
                    content: `Welcome, ${req.user.name}! So far you've had:\n${req.body.dose}${req.body.unit} of ${prettyName}`,
                    format: "msgToUser",
                });
                welcomeNote.save( (err, note) => {
                    if (err) throw err;
                    Log.updateOne(
                        { _id: log._id },
                        { $push: { notes: note, doses: dose } },
                        (err, log) => { if (err) throw err; }
                    );
                });
            })
        }
        User.updateOne(
            { _id: req.user._id },
            { $push: { logs: log } },
            (err, log) => { if (err) throw err; }
        );
        return res.redirect(`/logs/${log._id}`);
    });
});

/* GET show log */
router.get('/logs/:logId', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    Log.findById(req.params.logId)
    .populate('doses').populate('notes').populate('owner').lean()
    .then(log => {
        if (log.owner._id.equals(req.user._id)) {
            return res.render('log-show', { log });
        }
        return res.redirect(`/`);
    })
    .catch(err => {
        console.log(err);
        return res.redirect(`/`);
    });
});

router.post('/logs/:logId/addDose', connectEnsureLogin.ensureLoggedIn(), async(req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const prettyName = await getPrettyName(req.body.drug);
        const newDose = new Dose({
            drug: req.body.drug,
            dose: req.body.dose,
            unit: req.body.unit,
            prettyName: prettyName,
        });
        newDose.save((err, dose) => {
            var doseNoteStr = `Dose Added: ${req.body.dose}${req.body.unit} of `;
            if (prettyName) { doseNoteStr += `${req.body.drug} (${prettyName})`; }
            else { doseNoteStr += req.body.drug; }
            const doseNoteObj = new Note({
                content: doseNoteStr,
                format: "msgToUser",
            });
            doseNoteObj.save((err, doseNote) => {
                Log.updateOne(
                    { _id: req.params.logId },
                    { $push: { notes: doseNote, doses: dose } })
                .then( (err, log) => {
                    return setTimeout(() => { res.redirect(`/logs/${req.params.logId}`); }, 3000);
                });
            });
        });
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});

router.post('/logs/:logId/status', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        var statusTxt = "This log was reopened.";
        if (req.body.currentStatus) { statusTxt = "This log was marked completed."; }
        const newStatusNote = new Note({
            content: statusTxt,
            format: "msgToUser",
        });
        newStatusNote.save((err, statusNote) => {
            Log.updateOne(
                { _id: req.params.logId },
                { $push: { notes: statusNote }, $set: { status: !req.body.currentStatus } })
            .then( (err, log) => {
                return res.redirect(`/logs/${req.params.logId}`);
            });
        });
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});

router.post('/logs/:logId/editNote', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const editNoteContent = req.body.editNoteText;
        if (editNoteContent.length < 1) {
            return res.redirect(`/logs/${req.params.logId}`);
        }
        const newEdit = new Note({ content: editNoteContent.trim(), format: "str" });
        newEdit.save((err, noteEdit) => {
            Note.updateOne(
                { _id: req.body.noteId },
                { $push: { edits: noteEdit } })
            .then( (err, note) => {
                return res.redirect(`/logs/${req.params.logId}`);
            });
        });
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});

router.post('/logs/:logId/addNote', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const noteTxt = req.body.note;
        if (noteTxt && noteTxt != "" && noteTxt.length > 1) {
            const newNote = new Note({ content: noteTxt.trim(), format: "str" });
            newNote.save((err, note) => {
                Log.updateOne(
                    { _id: req.params.logId },
                    { $push: { notes: note } },
                ).then((err, log) => {
                    return res.redirect(`/logs/${req.params.logId}`);
                });
            });
        } else {
            return res.redirect(`/logs/${req.params.logId}`);
        }
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});

router.post('/logs/:logId/editDetails', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        Log.updateOne(
            { _id: req.params.logId },
            { title: req.body.title, desc: req.body.desc }
        ).then( (err, log) => {
            return  res.redirect(`/logs/${req.params.logId}`);
        });
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});

// router.post('/logs/:logId/delete', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
//     // TODO
// })

/* GET show archive */
router.get('/archive', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    User.findById(req.user._id)
    .populate({ path: 'logs', options: { sort: { 'createdAt': -1 } } }).lean()
    .then(user => {
        return res.render('archive', { user });
    })
    .catch(err => {
        console.log(err);
        return res.redirect(`/`);
    });
});

/* GET show options */
router.get('/options', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    return res.render('options', {});
});

async function getPrettyName(name) {
    return new Promise(function(resolve,reject) {
        if (name && name != "") {
            fetch(`http://tripbot.tripsit.me/api/tripsit/getDrug?name=${name}`)
            .then( r => {
                return r.json();
            })
            .then( drugInfo => {
                if (!drugInfo.err) {
                    const prettyName = drugInfo.data[0].pretty_name;
                    resolve(prettyName);
                }
            }).catch( err => {
                resolve(null);
            });
        } else {
            resolve(null);
        }
    });
}

/*async function askTheCaterpillar(question) {
    return new Promise(function(resolve,reject) {
        fetch(`https://www.askthecaterpillar.com/query?query=${question}`, {method: 'POST'})
        .then( r => { return r.json(); })
        .then( data => {
            const answer = data.data.messages[0].content;
            resolve(answer);
        }).catch( err => {
            resolve(`So sorry! Ask The Caterpillar is currently down, try again later.`);
        });
    });
}*/

module.exports = router;
