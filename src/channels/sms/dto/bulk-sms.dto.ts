import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkRecipientDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ example: 'Custom message for this recipient' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: { name: 'John' } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class SendBulkSmsDto {
  @ApiProperty({ type: [BulkRecipientDto], description: 'List of recipients' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRecipientDto)
  recipients: BulkRecipientDto[];

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  templateCode?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'])
  messageType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  batchSize?: number;

  @IsOptional()
  @IsString()
  dltTemplateId?: string;

  @IsOptional()
  @IsString()
  dltEntityId?: string;
}
