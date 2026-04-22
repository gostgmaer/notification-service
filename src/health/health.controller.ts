import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { Public } from '../shared/auth/api-key.guard';

@ApiTags('Health')
@Public()
@Controller('v1/health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check — MongoDB ping + heap memory' })
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  detailed() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — always returns 200' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
