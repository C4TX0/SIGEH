const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { monitorOverview, replicationStatus } = require('../controllers/infraController');

const router = express.Router();

router.get('/monitor/overview', auth, authorize(['ADMIN']), monitorOverview);
router.get('/replication/status', auth, authorize(['ADMIN']), replicationStatus);

module.exports = router;
