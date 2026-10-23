-- ============================================================
-- V11 : Kafka Outbox Table
-- Transactional outbox pattern ensures events are published
-- exactly-once even if Kafka is temporarily unavailable.
-- A scheduler sweeps PENDING rows and publishes to Kafka.
-- ============================================================

CREATE TABLE kafka_outbox_events (
    id              BIGSERIAL PRIMARY KEY,
    aggregate_type  VARCHAR(100) NOT NULL,   -- TenantCreated|EmployeeCreated|StudentPromoted
    aggregate_id    VARCHAR(100) NOT NULL,   -- entity id that triggered the event
    topic           VARCHAR(200) NOT NULL,
    event_key       VARCHAR(200),
    payload         TEXT         NOT NULL,   -- JSON event body
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING|PUBLISHED|FAILED
    error_message   TEXT,
    retry_count     INTEGER      NOT NULL DEFAULT 0,
    max_retries     INTEGER      NOT NULL DEFAULT 3,
    scheduled_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_status    ON kafka_outbox_events(status, scheduled_at);
CREATE INDEX idx_outbox_aggregate ON kafka_outbox_events(aggregate_type, aggregate_id);
