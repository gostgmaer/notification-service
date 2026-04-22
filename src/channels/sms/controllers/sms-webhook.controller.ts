import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { SmsWebhookService } from '../services/sms-webhook.service';
import { Public } from '../../../shared/auth/api-key.guard';

function makeHandler(providerName: string, sigHeader: string) {
  return function (webhookService: SmsWebhookService) {
    return async (req: Request, body: any, headers: any) => {
      const signature = headers[sigHeader] || headers['x-webhook-signature'] || '';
      try {
        const result = await webhookService.processWebhook(
          providerName, body, signature, headers,
          `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        );
        return { received: true, ...result };
      } catch {
        return { received: true };
      }
    };
  };
}

@Public()
@Controller('v1/webhooks')
export class SmsWebhookController {
  constructor(private readonly webhookService: SmsWebhookService) {}

  @Post('twilio')
  async twilio(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('twilio', 'x-twilio-signature', req, body, headers);
  }

  @Post('vonage')
  async vonage(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('vonage', 'x-nexmo-signature', req, body, headers);
  }

  @Post('msg91')
  async msg91(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('msg91', 'x-msg91-signature', req, body, headers);
  }

  @Post('fast2sms')
  async fast2sms(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('fast2sms', 'x-fast2sms-signature', req, body, headers);
  }

  @Post('textlocal')
  async textlocal(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('textlocal', 'x-textlocal-hash', req, body, headers);
  }

  @Post('gupshup')
  async gupshup(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('gupshup', 'x-hub-signature-256', req, body, headers);
  }

  @Post('kaleyra')
  async kaleyra(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('kaleyra', 'x-kaleyra-signature', req, body, headers);
  }

  @Post('exotel')
  async exotel(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('exotel', 'x-exotel-signature', req, body, headers);
  }

  @Post('infobip')
  async infobip(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('infobip', 'ibm-signature', req, body, headers);
  }

  @Post('telnyx')
  async telnyx(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('telnyx', 'telnyx-signature-ed25519', req, body, headers);
  }

  @Post('sinch')
  async sinch(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('sinch', 'x-sinch-signature', req, body, headers);
  }

  @Post('plivo')
  async plivo(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('plivo', 'x-plivo-signature-v2', req, body, headers);
  }

  @Post('d7networks')
  async d7networks(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('d7networks', 'x-d7-signature', req, body, headers);
  }

  @Post('jiocx')
  async jiocx(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('jiocx', 'x-jiocx-signature', req, body, headers);
  }

  @Post('airteliq')
  async airteliq(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('airteliq', 'x-airtel-signature', req, body, headers);
  }

  @Post('routemobile')
  async routemobile(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('routemobile', 'x-rm-signature', req, body, headers);
  }

  @Post('valuefirst')
  async valuefirst(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('valuefirst', 'x-vf-signature', req, body, headers);
  }

  @Post('smscountry')
  async smscountry(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('smscountry', 'x-smscountry-signature', req, body, headers);
  }

  @Post('smsgateway')
  async smsgateway(@Req() req: Request, @Body() body: any, @Headers() headers: any) {
    return this._handle('smsgateway', 'x-hub-signature', req, body, headers);
  }

  private async _handle(provider: string, sigHeader: string, req: Request, body: any, headers: any): Promise<any> {
    const signature = headers[sigHeader] || headers['x-webhook-signature'] || '';
    try {
      const result = await this.webhookService.processWebhook(
        provider, body, signature, headers,
        `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      );
      return { received: true, ...result };
    } catch {
      return { received: true };
    }
  }
}
