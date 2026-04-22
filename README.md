# Notification Service

Unified **SMS + Email** notification service built with [NestJS](https://nestjs.com/).  
Supports 32+ SMS providers, 378 email templates, multi-tenancy, BullMQ queuing, Kafka integration, and Redis caching.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup (without Docker)](#local-setup-without-docker)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Multi-Tenancy](#multi-tenancy)
- [API Reference](#api-reference)
  - [SMS](#sms)
  - [SMS Templates](#sms-templates)
  - [SMS Analytics](#sms-analytics)
  - [Email](#email)
  - [Health](#health)
- [SMS Providers](#sms-providers)
- [Email Templates](#email-templates)
- [Queue (BullMQ)](#queue-bullmq)
- [Kafka Integration](#kafka-integration)
- [Swagger UI](#swagger-ui)
- [Rate Limiting](#rate-limiting)
- [GDPR / PII Purge](#gdpr--pii-purge)

---

## Features

- **SMS** — send single, bulk, OTP, and template-based SMS via 32 providers
- **Email** — send transactional emails using 378 pre-built templates
- **Multi-provider failover** — automatic fallback if the primary SMS provider fails
- **BullMQ queuing** — async processing with configurable concurrency (toggled via env)
- **Kafka** — publish/consume notification events (optional, toggled via env)
- **Redis caching** — template and analytics caching (optional)
- **Multi-tenancy** — all data scoped by `x-tenant-id` header
- **API Key authentication** — single shared key or open (no key) mode
- **Rate limiting** — configurable throttle (TTL + max requests)
- **GDPR purge** — erase PII from logs on demand
- **Webhook receivers** — inbound delivery receipts from SMS providers
- **Health checks** — MongoDB ping, heap memory, RSS memory probes
- **Swagger UI** — interactive API docs (dev/staging only)

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | NestJS 10                           |
| Language    | TypeScript                          |
| Database    | MongoDB (via Mongoose)              |
| Cache / Queue | Redis, BullMQ                     |
| Messaging   | Kafka (KafkaJS)                     |
| Email       | Nodemailer                          |
| Auth        | API Key (header-based)              |
| Docs        | Swagger / OpenAPI                   |
| Containerisation | Docker + Docker Compose        |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- MongoDB (local or Atlas)
- Redis (required for BullMQ / cache features)

### Local Setup (without Docker)

```bash
# 1. Clone and install dependencies
pnpm install

# 2. Copy the example env file and fill in your values
cp .env.example .env   # or create .env manually (see Environment Variables section)

# 3. Start in development mode (hot-reload)
pnpm start:dev

# 4. Build for production
pnpm build
pnpm start:prod
```

The service listens on **port 4000** by default (`PORT` env overrides this).

### Docker Setup

**Default stack** (app + MongoDB + Redis):

```bash
docker compose up --build
```

**With Kafka:**

```bash
docker compose --profile kafka up --build
```

**With MailHog** (local email catch-all for development):

```bash
docker compose --profile mailhog up --build
# MailHog UI → http://localhost:8025
# SMTP port  → localhost:1025
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are optional unless marked **required**.

### Core

| Variable            | Default                                       | Description                          |
|---------------------|-----------------------------------------------|--------------------------------------|
| `PORT`              | `4000`                                        | HTTP port                            |
| `NODE_ENV`          | `development`                                 | `development` / `production`         |
| `API_KEY`           | _(empty — open access)_                       | **Required** for authenticated mode  |
| `DEFAULT_TENANT_ID` | _(none)_                                      | Fallback tenant when header absent   |
| `CORS_ORIGINS`      | `*`                                           | Comma-separated allowed origins      |

### MongoDB

| Variable       | Default                                          | Description         |
|----------------|--------------------------------------------------|---------------------|
| `MONGODB_URI`  | `mongodb://localhost:27017/notification-service` | MongoDB connection string |

### Redis

| Variable         | Default | Description              |
|------------------|---------|--------------------------|
| `REDIS_URL`      | _(empty)_ | Redis connection URL e.g. `redis://localhost:6379` |
| `REDIS_PASSWORD` | _(none)_  | Redis password (optional) |

### BullMQ (Queue)

| Variable                | Default | Description                           |
|-------------------------|---------|---------------------------------------|
| `ENABLE_BULL`           | `false` | Set `true` to enable async queuing    |
| `BULL_CONCURRENCY_SMS`  | `5`     | Parallel SMS workers                  |
| `BULL_CONCURRENCY_EMAIL`| `10`    | Parallel email workers                |

### Kafka

| Variable                       | Default                          | Description                    |
|--------------------------------|----------------------------------|--------------------------------|
| `ENABLE_KAFKA`                 | `false`                          | Set `true` to enable Kafka     |
| `KAFKA_BROKERS`                | `localhost:9092`                 | Comma-separated broker list    |
| `KAFKA_GROUP_ID`               | `notification-service`           | Consumer group ID              |
| `KAFKA_CLIENT_ID`              | `notification-service`           | Kafka client ID                |
| `KAFKA_TOPIC_SMS_SEND`         | `sms.notification.send`          | Topic for outbound SMS         |
| `KAFKA_TOPIC_SMS_DELIVERED`    | `sms.notification.delivered`     | Topic for SMS delivered events |
| `KAFKA_TOPIC_SMS_FAILED`       | `sms.notification.failed`        | Topic for SMS failure events   |
| `KAFKA_TOPIC_EMAIL_SEND`       | `email.notification.send`        | Topic for outbound email       |
| `KAFKA_TOPIC_EMAIL_DELIVERED`  | `email.notification.delivered`   | Topic for email delivered      |
| `KAFKA_TOPIC_EMAIL_FAILED`     | `email.notification.failed`      | Topic for email failure events |

### Cache

| Variable       | Default | Description                          |
|----------------|---------|--------------------------------------|
| `ENABLE_CACHE` | `false` | Set `true` to enable Redis caching   |

### Rate Limiting

| Variable         | Default | Description                         |
|------------------|---------|-------------------------------------|
| `THROTTLE_TTL`   | `60`    | Window in seconds                   |
| `THROTTLE_LIMIT` | `100`   | Max requests per window per IP      |

### SMS

| Variable                | Default  | Description                                   |
|-------------------------|----------|-----------------------------------------------|
| `SMS_DEFAULT_PROVIDER`  | `mock`   | Active provider (see [SMS Providers](#sms-providers)) |
| `SMS_FALLBACK_PROVIDER` | _(none)_ | Secondary provider on failure                 |
| `SMS_RETRY_ATTEMPTS`    | `3`      | Delivery retry count                          |
| `SMS_RETRY_DELAY_MS`    | `5000`   | Delay between retries (ms)                    |

### Email (SMTP)

| Variable                      | Default              | Description                        |
|-------------------------------|----------------------|------------------------------------|
| `EMAIL_HOST`                  | `smtp.gmail.com`     | SMTP host                          |
| `EMAIL_PORT`                  | `587`                | SMTP port                          |
| `EMAIL_SECURE`                | `false`              | Use TLS (`true` for port 465)      |
| `EMAIL_SERVICE`               | _(none)_             | Nodemailer service shortcut (e.g. `gmail`) |
| `EMAIL_USER`                  | _(required)_         | SMTP username / sender address     |
| `EMAIL_PASS`                  | _(required)_         | SMTP password or app password      |
| `EMAIL_FROM`                  | `EMAIL_USER`         | From address                       |
| `DEFAULT_FROM_NAME`           | `Notifications`      | From display name                  |
| `EMAIL_MAX_CONNECTIONS`       | `5`                  | SMTP pool max connections          |
| `EMAIL_MAX_MESSAGES`          | `100`                | Max messages per connection        |
| `EMAIL_TLS_REJECT_UNAUTHORIZED` | `true`            | Reject invalid TLS certificates    |
| `EMAIL_TLS_MIN_VERSION`       | `TLSv1.2`            | Minimum TLS version                |
| `EMAIL_DEBUG`                 | `false`              | Log SMTP traffic                   |

**Fallback SMTP** (used when primary fails):

| Variable                  | Description              |
|---------------------------|--------------------------|
| `FALLBACK_EMAIL_HOST`     | Fallback SMTP host       |
| `FALLBACK_EMAIL_SERVICE`  | Fallback service shortcut |
| `FALLBACK_EMAIL_PORT`     | Fallback SMTP port       |
| `FALLBACK_EMAIL_SECURE`   | Fallback TLS flag        |
| `FALLBACK_EMAIL_USER`     | Fallback SMTP username   |
| `FALLBACK_EMAIL_PASS`     | Fallback SMTP password   |

---

## Authentication

All endpoints (except `/v1/health/*`) require an API key.

Pass the key using **either** header:

```http
x-api-key: your-api-key
```

```http
Authorization: Bearer your-api-key
```

Set `API_KEY` in your `.env`. If `API_KEY` is empty, the service runs in **open mode** (no auth required — suitable for local development only).

---

## Multi-Tenancy

All data (SMS logs, email logs, templates, campaigns) is scoped to a **tenant**.  
Pass the tenant identifier in every request:

```http
x-tenant-id: my-tenant-id
```

If the header is omitted, the `DEFAULT_TENANT_ID` env value is used as the fallback.

---

## API Reference

Base URL: `http://localhost:4000`

---

### SMS

#### Send SMS

```
POST /v1/sms/send
```

| Field          | Type     | Required | Description                                         |
|----------------|----------|----------|-----------------------------------------------------|
| `to`           | string   | Yes      | Recipient phone (E.164 format, e.g. `+919876543210`) |
| `message`      | string   | No*      | Plain text body (*required if no template)          |
| `templateId`   | string   | No       | MongoDB ObjectId of a saved template                |
| `templateCode` | string   | No       | Template code slug                                  |
| `templateName` | string   | No       | Template name                                       |
| `variables`    | object   | No       | Key-value substitutions for template placeholders   |
| `from`         | string   | No       | Sender ID or number                                 |
| `messageType`  | string   | No       | `TRANSACTIONAL` \| `PROMOTIONAL` \| `OTP` \| `FLASH` |
| `unicode`      | boolean  | No       | Send as Unicode SMS                                 |
| `referenceId`  | string   | No       | Your reference ID (idempotency)                     |
| `dltTemplateId`| string   | No       | DLT Template ID (India TRAI compliance)             |
| `dltEntityId`  | string   | No       | DLT Entity ID (India TRAI compliance)               |
| `metadata`     | object   | No       | Arbitrary metadata stored with the log              |

**Example request:**

```json
POST /v1/sms/send
x-api-key: your-key
x-tenant-id: my-app

{
  "to": "+919876543210",
  "message": "Your OTP is {{otp}}. Valid for 5 minutes.",
  "variables": { "otp": "847291" },
  "messageType": "OTP"
}
```

**Example response (202):**

```json
{
  "success": true,
  "data": {
    "messageId": "...",
    "status": "sent",
    "provider": "msg91"
  }
}
```

When `ENABLE_BULL=true` the response includes `jobId` and `queued: true` instead.

---

#### Send Bulk SMS

```
POST /v1/sms/send-bulk
```

Send an SMS campaign to multiple recipients at once. Creates a campaign record and dispatches individual messages.

---

#### List SMS Messages

```
GET /v1/sms?page=1&limit=20&status=sent
```

| Query Param | Description              |
|-------------|--------------------------|
| `page`      | Page number (default: 1) |
| `limit`     | Page size (default: 20)  |
| `status`    | Filter by delivery status |

---

#### Get SMS Message

```
GET /v1/sms/:messageId
```

---

#### GDPR Purge

```
DELETE /v1/sms/:messageId/gdpr-purge
```

Permanently erases all PII from the SMS log record. The log entry itself is kept for audit purposes with PII fields replaced.

---

### SMS Templates

Reusable template management for SMS content.

| Method   | Endpoint                          | Description                      |
|----------|-----------------------------------|----------------------------------|
| `POST`   | `/v1/templates`                   | Create a new template            |
| `GET`    | `/v1/templates?page=&limit=&search=` | List templates (paginated)    |
| `GET`    | `/v1/templates/:templateId`       | Get template by ID               |
| `PUT`    | `/v1/templates/:templateId`       | Update a template                |
| `DELETE` | `/v1/templates/:templateId`       | Delete a template                |
| `POST`   | `/v1/templates/import`            | Auto-import sample templates     |

**Create template example:**

```json
POST /v1/templates

{
  "name": "otp_verification",
  "code": "otp_verification",
  "body": "Your OTP is {{otp}}. Valid for {{minutes}} minutes.",
  "messageType": "OTP"
}
```

---

### SMS Analytics

| Method | Endpoint                                    | Description                         |
|--------|---------------------------------------------|-------------------------------------|
| `GET`  | `/v1/analytics/summary?from=&to=`           | Delivery summary stats              |
| `GET`  | `/v1/analytics/provider-health`             | Per-provider success/error rates (last 24 h) |
| `GET`  | `/v1/analytics/campaigns`                   | List all campaigns                  |
| `GET`  | `/v1/analytics/campaigns/:campaignId`       | Stats for a specific campaign       |
| `GET`  | `/v1/analytics/campaigns/:campaignId/detail`| Full campaign detail                |

---

### Email

#### Send Email

```
POST /v1/email/send
```

| Field             | Type     | Required | Description                                             |
|-------------------|----------|----------|---------------------------------------------------------|
| `to`              | string   | Yes      | Recipient email address                                 |
| `template`        | string   | No*      | Template name (*required if no `subject`/`html`/`text`) |
| `data`            | object   | No       | Template variable substitutions                         |
| `subject`         | string   | No       | Override subject (auto-generated by template if omitted)|
| `from`            | string   | No       | Override sender address                                 |
| `cc`              | string[] | No       | CC recipients                                           |
| `bcc`             | string[] | No       | BCC recipients                                          |
| `idempotencyKey`  | string   | No       | Prevent duplicate sends                                 |
| `applicationName` | string   | No       | App name used in template rendering                     |
| `appUrl`          | string   | No       | App URL used in template rendering                      |

**Example — Order Confirmed:**

```json
POST /v1/email/send
x-api-key: your-key
x-tenant-id: my-app

{
  "to": "john.doe@example.com",
  "template": "ORDER_CONFIRMED",
  "data": {
    "username": "John Doe",
    "orderId": "ORD-2026-001",
    "totalAmount": "₹1,499.00",
    "estimatedDelivery": "2026-04-25T00:00:00.000Z",
    "appUrl": "https://myapp.com"
  },
  "idempotencyKey": "order-ORD-2026-001-confirm"
}
```

**Example — OTP Email:**

```json
{
  "to": "john.doe@example.com",
  "template": "otpEmailTemplate",
  "data": {
    "name": "John Doe",
    "otp": "847291"
  }
}
```

---

### Health

All health endpoints are **public** (no API key required).

| Method | Endpoint              | Description                                    |
|--------|-----------------------|------------------------------------------------|
| `GET`  | `/v1/health`          | MongoDB ping + heap memory check               |
| `GET`  | `/v1/health/detailed` | MongoDB + heap + RSS memory check              |
| `GET`  | `/v1/health/live`     | Liveness probe — always returns `{ status: "ok" }` |

---

## SMS Providers

Set `SMS_DEFAULT_PROVIDER` (and optionally `SMS_FALLBACK_PROVIDER`) to one of:

| Provider Key   | Provider Name      |
|----------------|--------------------|
| `2factor`      | 2Factor            |
| `airteliq`     | Airtel IQ          |
| `awssns`       | AWS SNS            |
| `brevo`        | Brevo (Sendinblue) |
| `bulksms`      | BulkSMS            |
| `clickatell`   | Clickatell         |
| `d7networks`   | D7 Networks        |
| `exotel`       | Exotel             |
| `fast2sms`     | Fast2SMS           |
| `gupshup`      | Gupshup            |
| `infobip`      | Infobip            |
| `jiocx`        | JioCX              |
| `kaleyra`      | Kaleyra            |
| `messagebird`  | MessageBird        |
| `mock`         | Mock (dev/testing) |
| `msg91`        | MSG91              |
| `mtalkz`       | Mtalkz             |
| `netcore`      | Netcore            |
| `pinnacle`     | Pinnacle           |
| `plivo`        | Plivo              |
| `routemobile`  | Route Mobile       |
| `sarv`         | Sarv               |
| `sinch`        | Sinch              |
| `smscountry`   | SMSCountry         |
| `smsgateway`   | SMS Gateway        |
| `telnyx`       | Telnyx             |
| `textlocal`    | Textlocal          |
| `textmagic`    | TextMagic          |
| `twilio`       | Twilio             |
| `unifonic`     | Unifonic           |
| `valuefirst`   | ValueFirst         |
| `vonage`       | Vonage (Nexmo)     |

Use `mock` during local development — messages are logged but not sent.

---

## Email Templates

378 pre-built HTML templates are available. Common categories:

| Category      | Example Templates                                                      |
|---------------|------------------------------------------------------------------------|
| **Auth**      | `otpEmailTemplate`, `emailVerificationTemplate`, `welcomeEmailTemplate`, `passwordResetRequestTemplate`, `suspiciousLoginTemplate`, `accountLockedTemplate` |
| **User**      | `USER_CREATED`, `USER_WELCOME`, `USER_UPDATED`, `LOGIN_SUCCESS`, `NEW_DEVICE_LOGIN`, `ROLE_ASSIGNED` |
| **Orders**    | `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_SHIPPED`, `ORDER_DELIVERED`, `ORDER_CANCELLED`, `ORDER_REFUNDED` |
| **Payments**  | `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`, `INVOICE_GENERATED`, `INVOICE_PAID`, `INVOICE_OVERDUE` |
| **Subscriptions** | `SUBSCRIPTION_STARTED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_RENEWED`, `AUTO_RENEWAL_REMINDER` |
| **Cart**      | `CART_ABANDONED`, `WISHLIST_PRICE_DROP`, `WISHLIST_BACK_IN_STOCK`, `CART_EXPIRY_NOTIFICATION` |
| **Org/Team**  | `ORG_CREATED`, `ORG_MEMBER_INVITED`, `ORG_ROLE_ASSIGNED`, `ORG_API_KEY_CREATED`, `TEAM_INVITE` |
| **System**    | `SYSTEM_ALERT`, `MAINTENANCE_SCHEDULED`, `DEPLOYMENT_COMPLETED`        |
| **Marketing** | `FLASH_SALE_ANNOUNCEMENT`, `LOYALTY_POINTS_EARNED`, `BIRTHDAY_GREETING`, `NEW_PRODUCT_LAUNCH` |
| **Marketplace** | `MARKETPLACE_WELCOME`, `MARKETPLACE_NEW_REQUEST`, `MARKETPLACE_PAYMENT_RECEIVED` |

Pass the template name as the `template` field in `POST /v1/email/send` and supply the matching variables in `data`.

---

## Queue (BullMQ)

When `ENABLE_BULL=true`:

- `POST /v1/sms/send` and `POST /v1/sms/send-bulk` enqueue jobs to the **`sms`** queue.
- `POST /v1/email/send` enqueues jobs to the **`email`** queue.
- Background workers process jobs with configurable concurrency (`BULL_CONCURRENCY_SMS`, `BULL_CONCURRENCY_EMAIL`).
- Requires Redis (`REDIS_URL`).

When `ENABLE_BULL=false` (default), all sends are **synchronous** (processed immediately in the request).

---

## Kafka Integration

When `ENABLE_KAFKA=true`, the service starts a Kafka hybrid microservice:

- **Consumes** from `KAFKA_TOPIC_SMS_SEND` and `KAFKA_TOPIC_EMAIL_SEND` to trigger sends.
- **Publishes** to `..._DELIVERED` and `..._FAILED` topics after each attempt.

Requires Kafka brokers (`KAFKA_BROKERS`).  
Use the Docker Compose Kafka profile to run a local Kafka cluster:

```bash
docker compose --profile kafka up
```

---

## Swagger UI

Interactive API documentation is available in **non-production** environments:

```
http://localhost:4000/docs
```

Click **Authorize** and enter your API key to authenticate all requests in the UI.

> Swagger is disabled when `NODE_ENV=production`.

---

## Rate Limiting

All endpoints are rate-limited globally:

- **Window**: `THROTTLE_TTL` seconds (default: 60 s)
- **Limit**: `THROTTLE_LIMIT` requests per window per IP (default: 100)

Exceeding the limit returns `429 Too Many Requests`.

---

## GDPR / PII Purge

To erase personal data from an SMS log:

```
DELETE /v1/sms/:messageId/gdpr-purge
```

The log record is retained for audit purposes, but all PII fields (phone number, message body, etc.) are permanently overwritten.
