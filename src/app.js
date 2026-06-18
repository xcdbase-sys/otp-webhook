const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const limiter = require('./middleware/rateLimiter');
const otpRoutes = require('./routes/otp');
const whatsappService = require('./services/whatsapp');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api', limiter);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-API-Key');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/api', otpRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'OTP Webhook Server',
    version: '1.0.0',
    status: 'running'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error: ' + err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

const startServer = async () => {
  try {
    await whatsappService.initialize();
    
    app.listen(config.port, () => {
      logger.info('Server running in ' + config.nodeEnv + ' mode on port ' + config.port);
    });
  } catch (error) {
    logger.error('Failed to start server: ' + error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
