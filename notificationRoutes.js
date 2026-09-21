const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/vapid-public-key', notificationController.getPublicKey);
router.post('/subscribe', notificationController.subscribe);
router.post('/send-reminder', notificationController.sendReminder);

module.exports = router;
