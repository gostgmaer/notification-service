import { IsString, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Recipient phone number in E.164 format' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ example: 'otp_verification' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of the template' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ example: { name: 'John' } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({ example: 6, minimum: 4, maximum: 8, description: 'OTP length (4-8 digits)' })
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(8)
  otpLength?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 60, description: 'OTP expiry in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  expiresInMinutes?: number;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  to: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}
