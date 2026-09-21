require('dotenv').config();

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  port: toNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGO_URI,

  order: {
    expireMinutes: toNumber(process.env.ORDER_EXPIRE_MINUTES, 15),
    amountTolerance: toNumber(process.env.AMOUNT_TOLERANCE, 0),
  },

  bank: {
    bankId: process.env.BANK_ID,
    accountNo: process.env.BANK_ACCOUNT_NO,
    accountName: process.env.BANK_ACCOUNT_NAME,
    vietqrTemplate: process.env.VIETQR_TEMPLATE || 'compact2',
  },

  webhook: {
    apiKey: process.env.WEBHOOK_API_KEY,
    hmacSecret: process.env.WEBHOOK_HMAC_SECRET,
    signatureHeader: (process.env.WEBHOOK_SIGNATURE_HEADER || 'x-signature').toLowerCase(),
  },

  bankGateway: {
    baseUrl: process.env.BANK_GATEWAY_BASE_URL,
    apiToken: process.env.BANK_GATEWAY_API_TOKEN,
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@zimacademy.vn',
  },
};
