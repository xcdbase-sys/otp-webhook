const config = require('../config');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.apiKey) {
    logger.warn('Unauthorized access attempt from: ' + req.ip);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid API key'
    });
  }
  
  next();
};

module.exports = authenticate;
