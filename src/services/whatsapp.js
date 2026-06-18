const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const logger = require('../utils/logger');
const config = require('../config');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['OTP Webhook', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
          this.isConnected = true;
          logger.info('WhatsApp client connected');
          await this.processMessageQueue();
        }
        
        if (connection === 'close') {
          const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
          logger.warn('WhatsApp disconnected with status:', statusCode);
          
          this.isConnected = false;
          
          if (statusCode !== DisconnectReason.loggedOut) {
            logger.info('Attempting to reconnect...');
            setTimeout(() => this.initialize(), 5000);
          } else {
            logger.error('WhatsApp logged out, need re-authentication');
          }
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
      
    } catch (error) {
      logger.error('WhatsApp initialization error:', error);
      setTimeout(() => this.initialize(), 5000);
    }
  }

  async sendMessageWithRetry(to, message, retryCount = 0) {
    if (!this.isConnected) {
      logger.warn('WhatsApp not connected, queuing message');
      this.messageQueue.push({ to, message });
      return false;
    }

    try {
      await this.sock.sendMessage(to, { text: message });
      logger.info('Message sent to ' + to);
      return true;
    } catch (error) {
      logger.error('Send message attempt ' + (retryCount + 1) + ' failed: ' + error.message);
      
      if (retryCount < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        return this.sendMessageWithRetry(to, message, retryCount + 1);
      }
      
      logger.error('Max retries reached, message failed');
      return false;
    }
  }

  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    logger.info('Processing ' + this.messageQueue.length + ' queued messages');
    
    while (this.messageQueue.length > 0) {
      const { to, message } = this.messageQueue.shift();
      await this.sendMessageWithRetry(to, message);
    }
    
    this.isProcessingQueue = false;
  }
}

module.exports = new WhatsAppService();
