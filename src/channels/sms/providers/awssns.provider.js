'use strict';

const { SNSClient, PublishCommand, GetSMSAttributesCommand } = require('@aws-sdk/client-sns');
const BaseProvider = require('./base.provider');

class AWSSNSProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'awssns';
    this.client = new SNSClient({
      region: config.region || 'ap-south-1',
      credentials: config.accessKeyId ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined, // Falls back to AWS credential chain (IAM role, env vars)
    });
  }

  async send(payload) {
    try {
      const command = new PublishCommand({
        PhoneNumber: payload.to,
        Message: payload.message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: this.config.smsType || 'Transactional',
          },
          ...(this.config.senderId && {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: this.config.senderId,
            },
          }),
        },
      });
      const res = await this.client.send(command);
      return {
        success: true,
        providerMessageId: res.MessageId,
        status: 'SENT',
        cost: 0,
        currency: 'USD',
        rawResponse: res,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'USD', rawResponse: { error: err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return {
      status: 'UNKNOWN',
      rawResponse: { note: 'AWS SNS DLR via CloudWatch Logs — no direct status poll' },
    };
  }

  async getBalance() {
    return { balance: 0, currency: 'USD', rawResponse: { note: 'AWS SNS is pay-per-use — check Billing console' } };
  }

  mapStatus(s = '') {
    return s === 'SENT' ? 'SENT' : 'UNKNOWN';
  }
}

module.exports = AWSSNSProvider;
