const whatsappService = require('./whatsapp');
const config = require('../config');
const logger = require('../utils/logger');

class OTPHandler {
  async processOTP(otp, source = 'unknown') {
    const timestamp = new Date().toISOString();
    const message = '🔐 *Kode OTP Moonton Diterima*\n\n' +
                   '📱 *Kode:* `' + otp + '`\n' +
                   '📡 *Sumber:* ' + source + '\n' +
                   '⏰ *Waktu:* ' + timestamp + '\n\n' +
                   '⚠️ Segera gunakan kode ini!';
    
    logger.info('Processing OTP for delivery');
    
    const success = await whatsappService.sendMessageWithRetry(
      config.targetNumber,
      message
    );
    
    return {
      success,
      otp: otp.substring(0, 2) + '****',
      timestamp,
      delivered: success
    };
  }
}

module.exports = new OTPHandler();
