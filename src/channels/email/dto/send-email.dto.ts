import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Available template names (378 total). Common ones:
 *
 * Auth:       otpEmailTemplate, emailVerificationTemplate, welcomeEmailTemplate,
 *             passwordResetRequestTemplate, passwordResetSuccessTemplate,
 *             suspiciousLoginTemplate, accountLockedTemplate
 *
 * User:       USER_CREATED, USER_WELCOME, USER_UPDATED, USER_DELETED,
 *             USER_SUSPENDED, ROLE_ASSIGNED, LOGIN_SUCCESS, NEW_DEVICE_LOGIN
 *
 * Orders:     ORDER_CREATED, ORDER_CONFIRMED, ORDER_SHIPPED, ORDER_DELIVERED,
 *             ORDER_CANCELLED, ORDER_REFUNDED, ORDER_PAYMENT_FAILED
 *
 * Payments:   PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_REFUNDED,
 *             INVOICE_GENERATED, INVOICE_PAID, INVOICE_OVERDUE
 *
 * Subscriptions: SUBSCRIPTION_STARTED, SUBSCRIPTION_CANCELLED,
 *                SUBSCRIPTION_RENEWED, AUTO_RENEWAL_REMINDER
 *
 * Cart:       CART_ABANDONED, CART_CREATED, WISHLIST_PRICE_DROP,
 *             WISHLIST_BACK_IN_STOCK, CART_EXPIRY_NOTIFICATION
 *
 * Org:        ORG_CREATED, ORG_MEMBER_INVITED, ORG_ROLE_ASSIGNED,
 *             ORG_API_KEY_CREATED, TEAM_INVITE
 *
 * System:     SYSTEM_ALERT, MAINTENANCE_SCHEDULED, DEPLOYMENT_COMPLETED
 *
 * Marketing:  FLASH_SALE_ANNOUNCEMENT, LOYALTY_POINTS_EARNED, BIRTHDAY_GREETING,
 *             NEW_PRODUCT_LAUNCH, PROMOTION_LAUNCHED
 *
 * Marketplace: MARKETPLACE_WELCOME, MARKETPLACE_NEW_REQUEST,
 *              MARKETPLACE_PAYMENT_RECEIVED, MARKETPLACE_JOB_ASSIGNED
 */
export class SendEmailDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  to: string;

  @ApiPropertyOptional({ example: 'noreply@easydev.in' })
  @IsOptional()
  @IsEmail()
  from?: string;

  @ApiPropertyOptional({ example: ['manager@easydev.in'], type: [String] })
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({ example: ['audit@easydev.in'], type: [String] })
  @IsOptional()
  @IsArray()
  bcc?: string[];

  @ApiPropertyOptional({
    example: 'Your order #ORD-2026-001 has been confirmed!',
    description: 'Email subject — if omitted, the template generates one automatically',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    example: 'ORDER_CONFIRMED',
    description:
      'Template name to render. See class docstring for full list of 378 templates. ' +
      'Examples: otpEmailTemplate | welcomeEmailTemplate | ORDER_CONFIRMED | PAYMENT_SUCCESS | ' +
      'CART_ABANDONED | SUBSCRIPTION_STARTED | USER_CREATED | TEAM_INVITE | BIRTHDAY_GREETING',
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of a stored custom template (alternative to template name)',
    example: '6650a1f2e4b0c23d4f8a91bc',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Variables injected into the template. Keys depend on the chosen template.',
    examples: {
      order_confirmed: {
        summary: 'ORDER_CONFIRMED data',
        value: {
          username: 'John Doe',
          orderId: 'ORD-2026-001',
          totalAmount: '₹1,499.00',
          estimatedDelivery: '2026-04-25T00:00:00.000Z',
          appUrl: 'https://myapp.com',
        },
      },
      payment_success: {
        summary: 'PAYMENT_SUCCESS data',
        value: {
          username: 'John Doe',
          amount: '₹1,499.00',
          transactionId: 'TXN-ABC-123456',
          paymentMethod: 'UPI',
          date: '2026-04-22T20:00:00.000Z',
        },
      },
      otp: {
        summary: 'otpEmailTemplate data',
        value: {
          name: 'John Doe',
          otp: '847291',
          purpose: 'login',
          expiryMinutes: 10,
        },
      },
      welcome: {
        summary: 'welcomeEmailTemplate data',
        value: {
          username: 'John Doe',
          appUrl: 'https://myapp.com',
        },
      },
      cart_abandoned: {
        summary: 'CART_ABANDONED data',
        value: {
          username: 'John Doe',
          cartId: 'CART-789',
          itemCount: 3,
          totalAmount: '₹2,799.00',
          items: [
            { name: 'Wireless Headphones', quantity: 1, price: '₹1,299.00' },
            { name: 'Phone Case', quantity: 2, price: '₹750.00' },
          ],
          abandonedAt: '2026-04-22T18:00:00.000Z',
          appUrl: 'https://myapp.com',
        },
      },
      subscription_started: {
        summary: 'SUBSCRIPTION_STARTED data',
        value: {
          username: 'John Doe',
          subscriptionName: 'Pro Plan',
          startDate: '2026-04-22T00:00:00.000Z',
          appUrl: 'https://myapp.com',
        },
      },
      team_invite: {
        summary: 'TEAM_INVITE data',
        value: {
          inviterName: 'Alice Smith',
          teamName: 'Engineering Team',
          inviteUrl: 'https://myapp.com/invite/abc123',
          appUrl: 'https://myapp.com',
        },
      },
      invoice_generated: {
        summary: 'INVOICE_GENERATED data',
        value: {
          username: 'John Doe',
          invoiceNumber: 'INV-2026-042',
          dueDate: '2026-05-01T00:00:00.000Z',
          amount: '₹4,999.00',
          invoiceUrl: 'https://myapp.com/invoices/INV-2026-042',
        },
      },
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'order-ORD-2026-001-confirm',
    description: 'Idempotency key — duplicate sends with same key are silently skipped',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    example: { source: 'checkout', userId: 'usr_123' },
    description: 'Arbitrary metadata stored with the log (not sent in email)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'https://myapp.com', description: 'Base URL for CTA buttons in templates' })
  @IsOptional()
  @IsString()
  appUrl?: string;

  @ApiPropertyOptional({ example: '/dashboard', description: 'CTA path appended to appUrl for primary button' })
  @IsOptional()
  @IsString()
  ctaPath?: string;
}

