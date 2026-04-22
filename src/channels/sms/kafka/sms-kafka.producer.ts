import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class SmsKafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsKafkaProducer.name);
  private producer: Producer | null = null;
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.get<boolean>('kafka.enabled')) return;
    const kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId'),
      brokers: this.config.get<string[]>('kafka.brokers'),
    });
    this.producer = kafka.producer();
    await this.producer.connect();
    this.connected = true;
    this.logger.log('SMS Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer && this.connected) {
      await this.producer.disconnect();
    }
  }

  async publish(topic: string, payload: unknown): Promise<void> {
    if (!this.producer || !this.connected) return;
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }

  async publishDelivered(messageId: string, details: unknown): Promise<void> {
    const topic = this.config.get<string>('kafka.topics.smsDelivered');
    return this.publish(topic, { messageId, details, timestamp: new Date().toISOString() });
  }

  async publishFailed(messageId: string, error: string): Promise<void> {
    const topic = this.config.get<string>('kafka.topics.smsFailed');
    return this.publish(topic, { messageId, error, timestamp: new Date().toISOString() });
  }
}
