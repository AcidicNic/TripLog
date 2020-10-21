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

        if (!req.body.drug || !tripping) {
            const welcomeNote = new Note({
                content: `Welcome, ${req.user.name}!\nYou can use the dropdown menu on the top left to add a dose!`,
                format: "msgToUser",
                log: log._id,
            });
            welcomeNote.save( (err, note) => {
                if (err) throw err;
                Log.updateOne(
                    { _id: log._id },
                    { $push: { notes: note } })
                .then( (err) => {
                    return res.redirect(`/logs/${log._id}`);
                });
            });
        } else if (Array.isArray(req.body.drug)) {
            var msgStr = ""
            var doseArr = [];
            for (i = 0; i < req.body.drug.length; i++) {
                try {
                    var drugInfo = await getDrugInfo(req.body.drug[i]);
                } catch (err) {
                    console.log(err);
                    var drugInfo = [null, null];
                }
                doseArr.push(new Dose({
                    drug: req.body.drug[i],
                    dose: req.body.dose[i],
                    unit: req.body.unit[i],
                    log: log._id,
                    prettyName: await drugInfo[0],
                    info: await drugInfo[1],
                }));

                msgStr += `\n${req.body.dose[i]}${req.body.unit[i]} of ${req.body.drug[i]}`
                if (drugInfo[0]) {
                    msgStr += ` (${drugInfo[0]})`
                }
            }
            Dose.insertMany(doseArr, (err, doseArr) => {
                if (err) throw err;

                const welcomeNote = new Note({
                    content: `Welcome, ${req.user.name}! So far you've had:${msgStr}`,
                    format: "msgToUser",
                    log: log._id,
                });
                welcomeNote.save( (err, note) => {
                    if (err) throw err;
                    Log.updateOne(
                        { _id: log._id },
                        { $push: { notes: note, doses: doseArr } })
                    .then( (err, log) => {
                        return res.redirect(`/logs/${log._id}`);
                    });
                });
            })
        } else {
            try {
                var drugInfo = await getDrugInfo(req.body.drug);
            } catch (err) {
                console.log(err);
                var drugInfo = [null, null];
            }
            const dose = new Dose({
                drug: req.body.drug,
                dose: req.body.dose,
                unit: req.body.unit,
                log: log._id,
                prettyName: await drugInfo[0],
                info: await drugInfo[1],
            });
            var welcomeText = `Welcome, ${req.user.name}! So far you've had:\n${req.body.dose}${req.body.unit} of ${req.body.drug}`
            if (drugInfo[0]) {
                welcomeText += ` (${drugInfo[0]})`
            }
            dose.save((err, dose) => {
                const welcomeNote = new Note({
                    content: welcomeText,
                    format: "msgToUser",
                    log: log._id,
                });
                welcomeNote.save( (err, note) => {
                    if (err) throw err;
                    Log.updateOne(
                        { _id: log._id },
                        { $push: { notes: note, doses: dose } })
                    .then( (err, log) => {
                        return res.redirect(`/logs/${log._id}`);
                    });
                });
            })
        }
        User.updateOne(
            { _id: req.user._id },
            { $push: { logs: log } }).
            then( (err, user) => {
                return res.redirect(`/logs/${log._id}`);
            });
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

/* POST add single dose */
router.post('/logs/:logId/addDose', connectEnsureLogin.ensureLoggedIn(), async(req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const drugInfo = await getDrugInfo(req.body.drug);
        const newDose = new Dose({
            drug: req.body.drug,
            dose: req.body.dose,
            unit: req.body.unit,
            log: req.params.logId,
            prettyName: await drugInfo[0],
            info: await drugInfo[1],
        });

        newDose.save((err, dose) => {
            var doseNoteStr = `Dose Added: ${req.body.dose}${req.body.unit} of ${req.body.drug}`;
            if (drugInfo[0]) { doseNoteStr += ` (${drugInfo[0]})`; }
            const doseNoteObj = new Note({
                content: doseNoteStr,
                format: "msgToUser",
                log: req.params.logId,
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

/* POST update status */
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
            log: req.params.logId,
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

/* POST add edit note */
router.post('/logs/:logId/editNote', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const editNoteContent = req.body.editNoteText;
        if (editNoteContent.length < 1) {
            return res.redirect(`/logs/${req.params.logId}`);
        }
        const newEdit = new Note({
            content: editNoteContent.trim(),
            format: "str",
            log: req.params.logId,
        });
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

/* POST add note */
router.post('/logs/:logId/addNote', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        const noteTxt = req.body.note;
        if (noteTxt && noteTxt != "" && noteTxt.length > 1) {
            const newNote = new Note({
                content: noteTxt.trim(),
                format: "str",
                log: req.params.logId,
            });
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

/* POST edit lot title/desc */
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

/*POST edit log title, desc, & doses
router.post('/logs/:logId/editLog', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        if (!req.body.drug || !tripping) {
            const updateNote = new Note({
                content: `Log updated. There are currently no doses.`,
                format: "msgToUser",
                log: log._id,
            });
            updateNote.save().then( (err, note) => {
                Log.updateOne(
                    { _id: log._id },
                    { $push: { notes: note },
                    $set: { title: req.body.title, desc: req.body.desc } })
                    .then( (err, log) => {
                        return res.redirect(`/logs/${req.params.logId}`);
                    });
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
                    log: log._id,
                    prettyName: await prettyName,
                }));
                msgStr += `\n${req.body.dose[i]}${req.body.unit[i]} of ${prettyName}`
            }
            Dose.insertMany(doseArr, (err, doses) => {
                const doseMsg = new Note({
                    content: `You've updated your doses! ${req.user.name}! So far you've had:${msgStr}`,
                    format: "msgToUser",
                    log: log._id,
                });
                doseMsg.save( (err, note) => {
                    Log.updateOne(
                        { _id: log._id },
                        { $push: { notes: note}, $set: {doses: doses} })
                    .then( (err, log) => {

                    });
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
                log: log._id,
                prettyName: await prettyName,
            });
            dose.save((err, dose) => {
                const welcomeNote = new Note({
                    content: `Welcome, ${req.user.name}! So far you've had:\n${req.body.dose}${req.body.unit} of ${prettyName}`,
                    format: "msgToUser",
                    log: log._id,
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
        Log.updateOne(
            { _id: req.params.logId },
            { title: req.body.title, desc: req.body.desc }
        ).then( (err, log) => {
            return  res.redirect(`/logs/${req.params.logId}`);
        });
    } catch (err) { if (err) { console.log(err); return res.redirect(`/logs/${req.params.logId}`); } }
});*/

/* POST delete log */
router.post('/logs/:logId/delete', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (req.user.logs.indexOf(req.params.logId) < 0) {
        return res.redirect(`/`);
    }
    try {
        Log.findOneAndRemove({ _id: req.params.logId })
        .then( (err, log) => {
            Dose.deleteMany({ log: req.params.logId })
            .then( (err, dose) => {
                Note.deleteMany({ log: req.params.logId })
                .then( (err, log) => {
                    return res.redirect(`/?msg=Your log has successfully been deleted!`);
                });
            })
        });
    } catch (err) { if (err) { console.log(err); return res.redirect('/?err=Oops, something went wrong!'); } }
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

/* GET show options
router.get('/options', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    return res.render('options', {});
});*/

async function getDrugInfo(name) {
    return new Promise(function(resolve,reject) {
        if (name && name != "") {
            fetch(`http://tripbot.tripsit.me/api/tripsit/getDrug?name=${name}`)
            .then( r => {
                return r.json();
            })
            .then( drugInfo => {
                if (!drugInfo.err) {
                    const data = drugInfo.data[0]
                    const prettyName = data.pretty_name;
                    const info = {
                        "summary": data.properties.summary,
                        "aliases": data.properties.aliases.join(', '),
                        "avoid": data.properties.avoid,
                        "effects": data.properties.effects,
                        "dose": data.properties.dose,
                        "categories": data.properties.categories.join(', '),
                        "duration": data.properties.duration,
                        "onset": data.properties.onset,
                        "halfLife": data.properties["half-life"],
                        "afterEffects": data.properties["after-effects"],
                    }
                    resolve([prettyName, info]);
                } else {
                    resolve([null, null]);
                }
            }).catch( err => {
                resolve([null, null]);
            });
        } else {
            resolve([null, null]);
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
