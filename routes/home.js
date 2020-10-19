const express = require('express');
const router = express.Router();

/* Get Launch Page */
router.get('/', (req, res) => {
    res.render("home", { err: req.query.err, msg: req.query.msg });
});

module.exports = router;
