import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ example: '+919876543210', description: 'Recipient phone number in E.164 format' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ example: 'MYAPP', description: 'Sender ID or number' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: 'Your OTP is {{otp}}', description: 'Message body (required if no templateId/Code)' })
  @IsOptional()
  @IsString()
  @MaxLength(1600)
  message?: string;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of the template' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ example: 'otp_verification', description: 'Template code' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiPropertyOptional({ example: 'OTP Verification', description: 'Template name' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({ example: { otp: '123456', name: 'John' }, description: 'Template variable substitutions' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({ enum: ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'], example: 'TRANSACTIONAL' })
  @IsOptional()
  @IsEnum(['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'])
  messageType?: string;

  @ApiPropertyOptional({ example: false, description: 'Send as Unicode SMS' })
  @IsOptional()
  @IsBoolean()
  unicode?: boolean;

  @ApiPropertyOptional({ example: 'order-123', description: 'Your reference ID for idempotency' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'DLT Template ID (India TRAI compliance)' })
  @IsOptional()
  @IsString()
  dltTemplateId?: string;

  @ApiPropertyOptional({ description: 'DLT Entity ID (India TRAI compliance)' })
  @IsOptional()
  @IsString()
  dltEntityId?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata stored with the log' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
