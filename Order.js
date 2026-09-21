const mongoose = require('mongoose');
const { Schema } = mongoose;

const ORDER_STATUS = ['PENDING', 'PAID', 'EXPIRED', 'CANCELED', 'OVERPAID', 'UNDERPAID'];

const orderSchema = new Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },

    amount: { type: Number, required: true, min: 1 }, // số tiền cần thanh toán (VND)
    amountReceived: { type: Number, default: 0 }, // tổng số tiền đã nhận được (có thể khác amount)

    status: { type: String, enum: ORDER_STATUS, default: 'PENDING', index: true },

    expiresAt: { type: Date, required: true, index: true }, // thời điểm QR hết hạn

    // Thông tin đối soát ngân hàng
    bankTransactionId: { type: String, default: null, index: true, sparse: true, unique: true },
    matchedGateway: { type: String, default: null }, // vd: "Vietcombank", "MBBank"
    matchedContent: { type: String, default: null }, // nội dung chuyển khoản gốc
    paidAt: { type: Date, default: null },

    // Lịch sử các lần webhook/cronjob chạm vào order này (phục vụ audit + debug)
    reconciliationLogs: [
      {
        source: { type: String, enum: ['WEBHOOK', 'CRONJOB'] },
        transactionId: String,
        amount: Number,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUS = ORDER_STATUS;
