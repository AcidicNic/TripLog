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
                type: "msgToUser",
            });
            welcomeNote.save( (err, note) => {
                if (err) throw err;
                Log.updateOne(
                    { _id: log._id },
                    { $push: { notes: note, doses: dose } },
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
                    type: "msgToUser",
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
                    type: "msgToUser",
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
            console.log(log);
            return res.render('log-show', { log });
        }
        return res.redirect(`/`);
    })
    .catch(err => {
        console.log(err);
        return res.redirect(`/`);
    });
});

/* POST show log (updates log/note/dose details)
    This handles most of the important stuff! */
router.post('/logs/:logId', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
        Log.findById(req.params.logId)
        .populate('doses').populate('notes').populate('owner').lean()
        .then( async (log) => {
            // Check that the current user owns this log.
            if (!log.owner._id.equals(req.user._id)) {return res.redirect(`/`);}

            // Check which form was submitted and handle the rest accordingly
            // req.body.update is a hidden value indluded in each form on /logs/:logId
            const reason = req.body.update;
            switch (reason) {
            // Adding a note
            case "add_note":
                const noteTxt = req.body.note;
                console.log(`noteTxt: ${noteTxt}`);
                if (noteTxt && noteTxt != "") {
                    /* the Ask The Caterpillar API is down until further notice,
                    the NLP library they were using wasn't maintained and it
                    stopped working. :(
                    https://github.com/estiens/caterpillar_rails/issues/25

                    if (noteTxt.substring(0, 3) === "???" && noteTxt.length > 4) {
                        const question = noteTxt.substring(4,);
                        try {
                            const answer = await askTheCaterpillar(question);
                        } catch (err) {
                            console.log(err);
                            const answer = `So sorry! Ask The Caterpillar is currently down, try again later.`;
                        }
                        Note.insertMany([
                            new Note({
                                content: question,
                                type: "question",
                            }),
                            new Note({
                                content: await answer,
                                type: "answer",
                            }),
                        ], (err, noteIds) => {
                            if (err) throw err;
                            Log.updateOne(
                                { _id: log._id },
                                { $push: { notes: noteIds } },
                                (err, log) => { if (err) throw err; }
                            );
                        })
                    } else {*/
                    const newNote = new Note({
                        content: noteTxt.trim(), type: "str",
                    });
                    newNote.save( (err, note) => {
                        if (err) throw err;
                        Log.updateOne(
                            { _id: log._id },
                            { $push: { notes: note } },
                            (err, log) => {
                                if (err) throw err;
                                res.redirect(`/logs/${log._id}`);
                            }
                        );
                    });
                }
                break;
            // Adding an edit to a note
            case "edit_note":
                const newEdit = new Note({
                    content: req.body.editNoteText, type: "str",
                });
                newEdit.save( (err, edit) => {
                    if (err) throw err;
                    Note.updateOne(
                        { _id: req.body.noteId },
                        { $push: { edits: edit } },
                        (err, log) => {
                            if (err) throw err;
                            res.redirect(`/logs/${log._id}`);
                        }
                    );
                });
                break;
            // Editting title/description of the log
            case "edit_details":
                Log.updateOne(
                    { _id: log._id },
                    {
                        title: req.body.title,
                        desc: req.body.desc,
                    },
                    (err, log) => {
                        if (err) throw err;
                        res.redirect(`/logs/${log._id}`);
                    }
                );
                break;
            // Adding a dose
            case "add_dose":
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
                    var noteStr = `Welcome, ${req.user.name}! So far you've had:\n${req.body.dose}${req.body.unit} of `
                    if (prettyName) {
                        noteStr += prettyName;
                    } else {
                        noteStr += req.body.drug;
                    }
                    const welcomeNote = new Note({
                        content: noteStr,
                        type: "msgToUser",
                    });
                    welcomeNote.save( (err, note) => {
                        if (err) throw err;
                        Log.updateOne(
                            { _id: log._id },
                            { $push: { notes: note, doses: dose } },
                            (err, log) => {
                                if (err) throw err;
                                res.redirect(`/logs/${log._id}`);
                            }
                        );
                    });
                })
                break;
            // Changing the log's status
            case "status":
                var statusTxt = "This log was reopened.";
                if (log.status) {
                    statusTxt = "This log was marked completed.";
                }
                const newNote = new Note({
                    content: statusTxt,
                    type: "msgToUser",
                });
                newNote.save( (err, note) => {
                    if (err) throw err;
                    Log.updateOne(
                        { _id: log._id },
                        {
                            $push: { notes: note },
                            $set: { status: !log.status },
                        },
                        (err, log) => {
                            if (err) throw err;
                            res.redirect(`/logs/${log._id}`);
                        }
                    );
                });
                break;
            }
            res.redirect(`/logs/${log._id}`);
        }).catch(err => {
            console.log(err);
            res.redirect(`/logs/${log._id}`);
        })
});

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
                reject(err);
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
