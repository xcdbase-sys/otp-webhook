const Joi = require('joi');
const logger = require('../utils/logger');

const otpSchema = Joi.object({
  otp: Joi.string()
    .required()
    .pattern(/^\d{4,8}$/)
    .messages({
      'string.pattern.base': 'OTP must be 4-8 digits only',
      'any.required': 'OTP is required',
      'string.empty': 'OTP cannot be empty'
    }),
  source: Joi.string().optional().max(50),
  timestamp: Joi.date().iso().optional()
});

const validateOTP = (req, res, next) => {
  const { error } = otpSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    logger.warn('Validation failed: ' + JSON.stringify(errors));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

module.exports = validateOTP;
