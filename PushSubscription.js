const mongoose = require('mongoose');
const { Schema } = mongoose;

const pushSubscriptionSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, index: true },

    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },

    userAgent: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
