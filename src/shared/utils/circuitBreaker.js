/**
 * Circuit Breaker Pattern Implementation
 * Optimized: ring buffer for state history, lazy timestamps
 */

const EventEmitter = require('events');
const logger = require('./logger');

const STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();

        this.name = options.name || 'circuit-breaker';
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 30000;
        this.halfOpenRequests = options.halfOpenRequests || 3;
        this.successThreshold = options.successThreshold || 3;

        this.state = STATES.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.halfOpenAttempts = 0;
        this.lastFailureTime = null;
        this.lastStateChange = Date.now();

        // Ring buffer for state history (max 20 entries) — avoids shift() O(n)
        this._historyBuffer = new Array(20);
        this._historyIdx = 0;
        this._historyCount = 0;

        // Statistics
        this.stats = {
            totalCalls: 0,
            totalSuccesses: 0,
            totalFailures: 0,
            rejectedCalls: 0
        };

        logger.info(`Circuit breaker initialized: ${this.name}`, {
            failureThreshold: this.failureThreshold,
            resetTimeout: this.resetTimeout,
            state: this.state
        });
    }

    async execute(fn) {
        this.stats.totalCalls++;

        if (this.state === STATES.OPEN) {
            if (this.shouldAttemptReset()) {
                this.transitionTo(STATES.HALF_OPEN);
            } else {
                this.stats.rejectedCalls++;
                const error = new Error(`Circuit breaker is open: ${this.name}`);
                error.code = 'CIRCUIT_OPEN';
                throw error;
            }
        }

        if (this.state === STATES.HALF_OPEN) {
            if (this.halfOpenAttempts >= this.halfOpenRequests) {
                this.stats.rejectedCalls++;
                const error = new Error(`Circuit breaker half-open limit reached: ${this.name}`);
                error.code = 'CIRCUIT_HALF_OPEN_LIMIT';
                throw error;
            }
            this.halfOpenAttempts++;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    onSuccess() {
        this.stats.totalSuccesses++;

        if (this.state === STATES.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.successThreshold) {
                this.transitionTo(STATES.CLOSED);
            }
        } else if (this.state === STATES.CLOSED) {
            this.failures = 0;
        }
    }

    onFailure(error) {
        this.stats.totalFailures++;
        this.failures++;
        this.lastFailureTime = Date.now();

        logger.warn(`Circuit breaker failure: ${this.name}`, {
            failures: this.failures,
            threshold: this.failureThreshold,
            state: this.state,
            error: error.message
        });

        if (this.state === STATES.HALF_OPEN) {
            this.transitionTo(STATES.OPEN);
        } else if (this.state === STATES.CLOSED && this.failures >= this.failureThreshold) {
            this.transitionTo(STATES.OPEN);
        }
    }

    shouldAttemptReset() {
        return Date.now() - this.lastFailureTime >= this.resetTimeout;
    }

    transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;
        this.lastStateChange = Date.now();

        // Ring buffer write — O(1), no shift()
        this._historyBuffer[this._historyIdx] = {
            from: oldState,
            to: newState,
            timestamp: this.lastStateChange
        };
        this._historyIdx = (this._historyIdx + 1) % 20;
        if (this._historyCount < 20) this._historyCount++;

        if (newState === STATES.CLOSED) {
            this.failures = 0;
            this.successes = 0;
            this.halfOpenAttempts = 0;
        } else if (newState === STATES.HALF_OPEN) {
            this.successes = 0;
            this.halfOpenAttempts = 0;
        }

        logger.info(`Circuit breaker state change: ${this.name}`, {
            from: oldState,
            to: newState
        });

        this.emit('stateChange', { from: oldState, to: newState, name: this.name });
    }

    forceOpen() {
        this.transitionTo(STATES.OPEN);
        this.lastFailureTime = Date.now();
    }

    forceClose() {
        this.transitionTo(STATES.CLOSED);
    }

    getStatus() {
        // Materialize ring buffer to array only on demand
        const history = [];
        const start = this._historyCount < 20 ? 0 : this._historyIdx;
        for (let i = 0; i < this._historyCount; i++) {
            const entry = this._historyBuffer[(start + i) % 20];
            history.push({
                from: entry.from,
                to: entry.to,
                timestamp: new Date(entry.timestamp).toISOString()
            });
        }

        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime
                ? new Date(this.lastFailureTime).toISOString()
                : null,
            lastStateChange: new Date(this.lastStateChange).toISOString(),
            stats: { ...this.stats, stateHistory: history }
        };
    }

    isAvailable() {
        if (this.state === STATES.CLOSED) return true;
        if (this.state === STATES.OPEN) return this.shouldAttemptReset();
        if (this.state === STATES.HALF_OPEN) return this.halfOpenAttempts < this.halfOpenRequests;
        return false;
    }
}

// Pre-configured circuit breakers
const circuitBreakers = {
    email: new CircuitBreaker({
        name: 'email-service',
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 3
    }),

    kafka: new CircuitBreaker({
        name: 'kafka-service',
        failureThreshold: 3,
        resetTimeout: 60000,
        successThreshold: 2
    }),

    database: new CircuitBreaker({
        name: 'database-service',
        failureThreshold: 3,
        resetTimeout: 10000,
        successThreshold: 2
    })
};

module.exports = {
    CircuitBreaker,
    STATES,
    circuitBreakers
};

