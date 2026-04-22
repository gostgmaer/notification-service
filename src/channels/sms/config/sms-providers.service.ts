import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const PROVIDER_MAP: Record<string, () => unknown> = {
  mock: () => require('../providers/mock.provider'),
  fast2sms: () => require('../providers/fast2sms.provider'),
  '2factor': () => require('../providers/2factor.provider'),
  smsgateway: () => require('../providers/smsgateway.provider'),
  infobip: () => require('../providers/infobip.provider'),
  telnyx: () => require('../providers/telnyx.provider'),
  vonage: () => require('../providers/vonage.provider'),
  msg91: () => require('../providers/msg91.provider'),
  d7networks: () => require('../providers/d7networks.provider'),
  sinch: () => require('../providers/sinch.provider'),
  textlocal: () => require('../providers/textlocal.provider'),
  gupshup: () => require('../providers/gupshup.provider'),
  plivo: () => require('../providers/plivo.provider'),
  twilio: () => require('../providers/twilio.provider'),
  awssns: () => require('../providers/awssns.provider'),
  kaleyra: () => require('../providers/kaleyra.provider'),
  airteliq: () => require('../providers/airteliq.provider'),
  jiocx: () => require('../providers/jiocx.provider'),
  exotel: () => require('../providers/exotel.provider'),
  routemobile: () => require('../providers/routemobile.provider'),
  valuefirst: () => require('../providers/valuefirst.provider'),
  smscountry: () => require('../providers/smscountry.provider'),
  mtalkz: () => require('../providers/mtalkz.provider'),
  clickatell: () => require('../providers/clickatell.provider'),
  brevo: () => require('../providers/brevo.provider'),
  bulksms: () => require('../providers/bulksms.provider'),
  textmagic: () => require('../providers/textmagic.provider'),
  messagebird: () => require('../providers/messagebird.provider'),
  netcore: () => require('../providers/netcore.provider'),
  sarv: () => require('../providers/sarv.provider'),
  pinnacle: () => require('../providers/pinnacle.provider'),
  unifonic: () => require('../providers/unifonic.provider'),
};

function buildProviderConfig(name: string, env: NodeJS.ProcessEnv): Record<string, unknown> {
  switch (name) {
    case 'twilio':
      return { accountSid: env.TWILIO_ACCOUNT_SID, authToken: env.TWILIO_AUTH_TOKEN, fromNumber: env.TWILIO_FROM_NUMBER };
    case 'msg91':
      return { authKey: env.MSG91_AUTH_KEY, senderId: env.MSG91_SENDER_ID, flowId: env.MSG91_FLOW_ID };
    case 'fast2sms':
      return { apiKey: env.FAST2SMS_API_KEY, senderId: env.FAST2SMS_SENDER_ID };
    case 'textlocal':
      return { apiKey: env.TEXTLOCAL_API_KEY, sender: env.TEXTLOCAL_SENDER };
    case 'vonage':
      return { apiKey: env.VONAGE_API_KEY, apiSecret: env.VONAGE_API_SECRET, from: env.VONAGE_FROM };
    case 'awssns':
      return { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, region: env.AWS_REGION };
    case 'gupshup':
      return { userId: env.GUPSHUP_USERID, password: env.GUPSHUP_PASSWORD };
    case 'kaleyra':
      return { apiKey: env.KALEYRA_API_KEY, sid: env.KALEYRA_SID, senderId: env.KALEYRA_SENDER_ID };
    case 'd7networks':
      return { apiToken: env.D7_API_TOKEN };
    case 'exotel':
      return { sid: env.EXOTEL_SID, token: env.EXOTEL_TOKEN, from: env.EXOTEL_FROM };
    case 'infobip':
      return { apiKey: env.INFOBIP_API_KEY, baseUrl: env.INFOBIP_BASE_URL };
    case 'telnyx':
      return { apiKey: env.TELNYX_API_KEY, messagingProfileId: env.TELNYX_MESSAGING_PROFILE_ID };
    case 'sinch':
      return { servicePlanId: env.SINCH_SERVICE_PLAN_ID, apiToken: env.SINCH_API_TOKEN, from: env.SINCH_FROM };
    case 'plivo':
      return { authId: env.PLIVO_AUTH_ID, authToken: env.PLIVO_AUTH_TOKEN, from: env.PLIVO_FROM };
    case 'messagebird':
      return { apiKey: env.MESSAGEBIRD_API_KEY, originator: env.MESSAGEBIRD_ORIGINATOR };
    case 'brevo':
      return { apiKey: env.BREVO_API_KEY };
    case 'bulksms':
      return { username: env.BULKSMS_USERNAME, password: env.BULKSMS_PASSWORD };
    case 'clickatell':
      return { apiKey: env.CLICKATELL_API_KEY };
    case 'jiocx':
      return { customerId: env.JIOCX_CUSTOMER_ID, key: env.JIOCX_KEY };
    case 'airteliq':
      return { clientId: env.AIRTELIQ_CLIENT_ID, clientSecret: env.AIRTELIQ_CLIENT_SECRET };
    case 'routemobile':
      return { username: env.ROUTEMOBILE_USERNAME, password: env.ROUTEMOBILE_PASSWORD, senderId: env.ROUTEMOBILE_SENDER_ID, account: env.ROUTEMOBILE_ACCOUNT };
    case 'valuefirst':
      return { username: env.VALUEFIRST_USERNAME, password: env.VALUEFIRST_PASSWORD };
    case 'smscountry':
      return { username: env.SMSCOUNTRY_USERNAME, password: env.SMSCOUNTRY_PASSWORD, senderId: env.SMSCOUNTRY_SENDER_ID };
    case '2factor':
      return { apiKey: env['2FACTOR_API_KEY'] };
    default:
      return {};
  }
}

@Injectable()
export class SmsProvidersService implements OnModuleInit {
  private readonly logger = new Logger(SmsProvidersService.name);
  private primaryProvider: any = null;
  private fallbackProvider: any = null;
  private primaryName: string;
  private fallbackName: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.primaryName =
      process.env.NODE_ENV === 'test'
        ? 'mock'
        : this.config.get<string>('sms.defaultProvider') || 'mock';
    this.fallbackName = this.config.get<string>('sms.fallbackProvider') || '';
    this.logger.log(`SMS provider: ${this.primaryName}${this.fallbackName ? ` (fallback: ${this.fallbackName})` : ''}`);
  }

  createProvider(name: string): any {
    const loader = PROVIDER_MAP[name];
    if (!loader) throw new Error(`Unknown SMS provider: "${name}"`);
    const ProviderClass = loader() as any;
    const cfg = buildProviderConfig(name, process.env);
    return new ProviderClass(cfg);
  }

  getProvider(): any {
    if (!this.primaryProvider) {
      this.primaryProvider = this.createProvider(this.primaryName);
    }
    return this.primaryProvider;
  }

  getFallbackProvider(): any | null {
    if (!this.fallbackName) return null;
    if (!this.fallbackProvider) {
      this.fallbackProvider = this.createProvider(this.fallbackName);
    }
    return this.fallbackProvider;
  }

  getProviderName(): string {
    return this.primaryName;
  }

  resetProviders(): void {
    this.primaryProvider = null;
    this.fallbackProvider = null;
  }
}
