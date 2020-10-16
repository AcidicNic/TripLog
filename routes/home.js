const express = require('express');
const router = express.Router();

/* Get Launch Page */
router.get('/', (req, res) => {
    res.render("home");
});

module.exports = router;
