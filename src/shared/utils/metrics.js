/**
 * Metrics Collection Utility
 * Optimized for minimal hot-path overhead
 */

const logger = require('./logger');

/**
 * Ring-buffer Histogram — O(1) observe, O(n) getStats (on demand only)
 */
class Histogram {
    constructor(name, buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]) {
        this.name = name;
        this.buckets = buckets.sort((a, b) => a - b);
        this.bucketCounts = new Map(buckets.map(b => [b, 0]));
        this.bucketCounts.set('+Inf', 0);

        // Ring buffer instead of shift()-based array — O(1) insert
        this._capacity = 1000;
        this._buffer = new Float64Array(this._capacity);
        this._writeIdx = 0;
        this._filled = false;

        this.sum = 0;
        this.count = 0;
        this._min = Infinity;
        this._max = -Infinity;
    }

    observe(value) {
        // Ring buffer write — O(1)
        this._buffer[this._writeIdx] = value;
        this._writeIdx++;
        if (this._writeIdx >= this._capacity) {
            this._writeIdx = 0;
            this._filled = true;
        }

        this.sum += value;
        this.count++;

        // Incremental min/max — avoids Math.min/max spread on 1000 values
        if (value < this._min) this._min = value;
        if (value > this._max) this._max = value;

        // Update bucket counts — cumulative
        let bucketFound = false;
        for (const bucket of this.buckets) {
            if (value <= bucket && !bucketFound) {
                this.bucketCounts.set(bucket, this.bucketCounts.get(bucket) + 1);
                bucketFound = true;
            }
        }
        this.bucketCounts.set('+Inf', this.bucketCounts.get('+Inf') + 1);
    }

    /** Get live values from ring buffer */
    _getValues() {
        const len = this._filled ? this._capacity : this._writeIdx;
        return this._buffer.subarray(0, len);
    }

    getPercentile(p) {
        const vals = this._getValues();
        if (vals.length === 0) return 0;
        // Sort a copy (only when stats are requested, not per-observe)
        const sorted = Array.from(vals).sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    getStats() {
        return {
            count: this.count,
            sum: this.sum,
            avg: this.count > 0 ? this.sum / this.count : 0,
            min: this.count > 0 ? this._min : 0,
            max: this.count > 0 ? this._max : 0,
            p50: this.getPercentile(50),
            p90: this.getPercentile(90),
            p99: this.getPercentile(99)
        };
    }
}

/**
 * Counter with fast label key generation
 */
class Counter {
    constructor(name) {
        this.name = name;
        this.value = 0;
        this.labels = new Map();
    }

    inc(labels = {}, value = 1) {
        this.value += value;

        // Fast label key — avoid JSON.stringify for single/empty labels
        const keys = Object.keys(labels);
        let labelKey;
        if (keys.length === 0) {
            labelKey = '{}';
        } else if (keys.length === 1) {
            labelKey = `${keys[0]}=${labels[keys[0]]}`;
        } else {
            labelKey = keys.sort().map(k => `${k}=${labels[k]}`).join(',');
        }

        const entry = this.labels.get(labelKey);
        if (entry) {
            entry.value += value;
        } else {
            this.labels.set(labelKey, { labels, value });
        }
    }

    get() {
        return this.value;
    }

    getWithLabels() {
        return {
            total: this.value,
            byLabel: Array.from(this.labels.values())
        };
    }
}

/**
 * Simple gauge for tracking current values
 */
class Gauge {
    constructor(name) {
        this.name = name;
        this.value = 0;
        this.lastUpdated = null;
    }

    set(value) {
        this.value = value;
        this.lastUpdated = Date.now();
    }

    inc(value = 1) {
        this.value += value;
        this.lastUpdated = Date.now();
    }

    dec(value = 1) {
        this.value -= value;
        this.lastUpdated = Date.now();
    }

    get() {
        return this.value;
    }
}

/**
 * Centralized Metrics Service
 */
class MetricsService {
    constructor() {
        this.startTime = Date.now();

        // Email metrics
        this.emailsSent = new Counter('emails_sent_total');
        this.emailsFailed = new Counter('emails_failed_total');
        this.emailsQueued = new Counter('emails_queued_total');
        this.emailsRetried = new Counter('emails_retried_total');
        this.emailLatency = new Histogram('email_send_duration_ms');

        // HTTP metrics
        this.httpRequests = new Counter('http_requests_total');
        this.httpLatency = new Histogram('http_request_duration_ms');

        // Kafka metrics
        this.kafkaMessagesPublished = new Counter('kafka_messages_published_total');
        this.kafkaMessagesConsumed = new Counter('kafka_messages_consumed_total');
        this.kafkaErrors = new Counter('kafka_errors_total');

        // Database metrics
        this.dbOperations = new Counter('db_operations_total');
        this.dbLatency = new Histogram('db_operation_duration_ms');

        // Connection pool metrics
        this.activeConnections = new Gauge('active_connections');
        this.poolWaiting = new Gauge('pool_waiting_requests');

        // Error metrics
        this.errors = new Counter('errors_total');

        // Circuit breaker metrics
        this.circuitBreakerState = new Map();
    }

    recordEmailSent(durationMs, labels = {}) {
        this.emailsSent.inc({ status: 'success', ...labels });
        this.emailLatency.observe(durationMs);
    }

    recordEmailFailed(labels = {}) {
        this.emailsFailed.inc(labels);
        this.emailsSent.inc({ status: 'failed', ...labels });
    }

    recordEmailQueued(labels = {}) {
        this.emailsQueued.inc(labels);
    }

    recordEmailRetried(labels = {}) {
        this.emailsRetried.inc(labels);
    }

    recordHttpRequest(method, path, statusCode, durationMs) {
        this.httpRequests.inc({ method, path, status: statusCode });
        this.httpLatency.observe(durationMs);
    }

    recordError(errorType, labels = {}) {
        this.errors.inc({ type: errorType, ...labels });
    }

    recordDbOperation(operation, durationMs, success = true) {
        this.dbOperations.inc({ operation, status: success ? 'success' : 'failed' });
        this.dbLatency.observe(durationMs);
    }

    updateCircuitBreakerState(name, state) {
        this.circuitBreakerState.set(name, {
            state,
            updatedAt: Date.now()
        });
    }

    getMetrics() {
        const now = Date.now();
        return {
            uptime: {
                startTime: new Date(this.startTime).toISOString(),
                uptimeMs: now - this.startTime,
                uptimeSeconds: Math.floor((now - this.startTime) / 1000)
            },
            email: {
                sent: this.emailsSent.getWithLabels(),
                failed: this.emailsFailed.get(),
                queued: this.emailsQueued.get(),
                retried: this.emailsRetried.get(),
                latency: this.emailLatency.getStats()
            },
            http: {
                requests: this.httpRequests.getWithLabels(),
                latency: this.httpLatency.getStats()
            },
            kafka: {
                published: this.kafkaMessagesPublished.get(),
                consumed: this.kafkaMessagesConsumed.get(),
                errors: this.kafkaErrors.get()
            },
            database: {
                operations: this.dbOperations.getWithLabels(),
                latency: this.dbLatency.getStats()
            },
            connections: {
                active: this.activeConnections.get(),
                poolWaiting: this.poolWaiting.get()
            },
            errors: this.errors.getWithLabels(),
            circuitBreakers: Object.fromEntries(this.circuitBreakerState),
            process: {
                pid: process.pid,
                memory: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            timestamp: new Date().toISOString()
        };
    }

    getPrometheusMetrics() {
        const lines = [];
        const now = Date.now();

        lines.push(`# HELP emails_sent_total Total number of emails sent`);
        lines.push(`# TYPE emails_sent_total counter`);
        lines.push(`emails_sent_total ${this.emailsSent.get()}`);

        lines.push(`# HELP emails_failed_total Total number of failed emails`);
        lines.push(`# TYPE emails_failed_total counter`);
        lines.push(`emails_failed_total ${this.emailsFailed.get()}`);

        lines.push(`# HELP emails_queued_total Total number of emails queued`);
        lines.push(`# TYPE emails_queued_total counter`);
        lines.push(`emails_queued_total ${this.emailsQueued.get()}`);

        const latencyStats = this.emailLatency.getStats();
        lines.push(`# HELP email_send_duration_ms Email send duration in milliseconds`);
        lines.push(`# TYPE email_send_duration_ms summary`);
        lines.push(`email_send_duration_ms_sum ${latencyStats.sum}`);
        lines.push(`email_send_duration_ms_count ${latencyStats.count}`);
        lines.push(`email_send_duration_ms{quantile="0.5"} ${latencyStats.p50}`);
        lines.push(`email_send_duration_ms{quantile="0.9"} ${latencyStats.p90}`);
        lines.push(`email_send_duration_ms{quantile="0.99"} ${latencyStats.p99}`);

        lines.push(`# HELP http_requests_total Total number of HTTP requests`);
        lines.push(`# TYPE http_requests_total counter`);
        lines.push(`http_requests_total ${this.httpRequests.get()}`);

        const mem = process.memoryUsage();
        lines.push(`# HELP process_memory_bytes Process memory in bytes`);
        lines.push(`# TYPE process_memory_bytes gauge`);
        lines.push(`process_memory_rss_bytes ${mem.rss}`);
        lines.push(`process_memory_heap_used_bytes ${mem.heapUsed}`);
        lines.push(`process_memory_heap_total_bytes ${mem.heapTotal}`);

        lines.push(`# HELP process_uptime_seconds Process uptime in seconds`);
        lines.push(`# TYPE process_uptime_seconds gauge`);
        lines.push(`process_uptime_seconds ${Math.floor((now - this.startTime) / 1000)}`);

        return lines.join('\n');
    }

    reset() {
        this.emailsSent = new Counter('emails_sent_total');
        this.emailsFailed = new Counter('emails_failed_total');
        this.emailsQueued = new Counter('emails_queued_total');
        this.emailsRetried = new Counter('emails_retried_total');
        this.emailLatency = new Histogram('email_send_duration_ms');
        this.httpRequests = new Counter('http_requests_total');
        this.httpLatency = new Histogram('http_request_duration_ms');
        this.errors = new Counter('errors_total');

        logger.debug('Metrics reset');
    }
}

// Singleton instance
const metrics = new MetricsService();

module.exports = {
    metrics,
    MetricsService,
    Counter,
    Gauge,
    Histogram
};

