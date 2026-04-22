import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EmailKafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailKafkaProducer.name);
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
    this.logger.log('Email Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer && this.connected) await this.producer.disconnect();
  }

  async publish(topic: string, payload: unknown): Promise<void> {
    if (!this.producer || !this.connected) return;
    await this.producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
  }

  async publishDelivered(requestId: string, messageId: string): Promise<void> {
    const topic = this.config.get<string>('kafka.topics.emailDelivered');
    return this.publish(topic, { requestId, messageId, timestamp: new Date().toISOString() });
  }

  async publishFailed(requestId: string, error: string): Promise<void> {
    const topic = this.config.get<string>('kafka.topics.emailFailed');
    return this.publish(topic, { requestId, error, timestamp: new Date().toISOString() });
  }
}
