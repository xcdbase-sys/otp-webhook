const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const validateOTP = require('../middleware/validator');
const otpHandler = require('../services/otpHandler');
const logger = require('../utils/logger');

router.post('/terima-otp', authenticate, validateOTP, async (req, res) => {
  try {
    const { otp, source } = req.body;
    
    const result = await otpHandler.processOTP(otp, source);
    
    if (result.success) {
      logger.info('OTP processed and delivered successfully');
      res.status(200).json({
        success: true,
        message: 'OTP received and forwarded',
        data: result
      });
    } else {
      throw new Error('Failed to deliver OTP');
    }
    
  } catch (error) {
    logger.error('OTP processing error: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process OTP',
      error: error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
