const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyWebhookSignature } = require('../middleware/verifyWebhookSignature');

const router = express.Router();

// Lưu ý: route này được mount với express.raw() ở app.js (không phải express.json())
// để middleware verifyWebhookSignature có thể tính HMAC trên đúng raw body.
router.post('/webhook', verifyWebhookSignature, paymentController.handleWebhook);

module.exports = router;
