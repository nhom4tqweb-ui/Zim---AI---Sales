const env = require('../config/env');

/**
 * Build a VietQR "quick link" image URL for the client to render as an <img>.
 * Docs: https://www.vietqr.io/danh-sach-api/
 *
 * Format:
 * https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png
 *   ?amount={amount}&addInfo={addInfo}&accountName={accountName}
 */
function buildVietQrQuickLink({ amount, addInfo }) {
  const { bankId, accountNo, accountName, vietqrTemplate } = env.bank;

  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName: accountName || '',
  });

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${vietqrTemplate}.png?${params.toString()}`;
}

module.exports = { buildVietQrQuickLink };
