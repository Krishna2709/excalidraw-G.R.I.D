sequenceDiagram
    autonumber
    participant U as Operator/Devices (POS, Lab Feeds)
    participant C as Cannabis App (Plant-Touching System)
    participant M as METRC API (State Traceability)
    participant E as ERP (Financials, SCM, Reporting)
    participant Q as Durable Queues/Outbox

    Note over C: Core Principles<br/>• Direct C↔M; avoid ERP↔M “telephone”<br/>• One-way C→E (authoritative plant-touching source)<br/>• State-by-state Rules Engine & Label/Tax/Purchase Guardrails<br/>• Idempotent writes, retries with backoff, audit logs, reconciliation jobs

    %% -------------------- INGEST --------------------
    rect rgb(245,245,245)
    U->>C: Capture events (plants, harvests, packages, transfers, test results, sales)
    C->>C: Normalize + enrich events (tag/UID mapping, batch/lot joins, unit conversions)
    C->>C: Validate via Rules Engine<br/>• purchase limits & equivalencies<br/>• label requirements (no overlap, sizes)<br/>• tax config present (retailer-owned)<br/>• batch/lot constraints (e.g., 10 lb lots)<br/>• role/permission checks
    end

    %% -------------------- WRITE TO METRC --------------------
    rect rgb(235,250,235)
    C->>Q: Write to Outbox (idempotency_key, schema_v, event_type, payload)
    Q->>M: POST to METRC endpoints (Plants, Harvests, Packages, Transfers, Sales, Lab Results)
    M-->>Q: 2xx (accepted)
    Q-->>C: Ack + persist METRC IDs / links
    end

    %% -------------------- FAILURE MODES (METRC LEG) --------------------
    rect rgb(255,240,240)
    alt METRC down / 5xx / timeouts
        Q-->>Q: Exponential backoff + jitter; circuit breaker open
        Q->>C: Alert + health telemetry
    else 4xx validation (schema, business rules)
        M-->>Q: 4xx + error details
        Q->>C: Dead-letter with context (payload, attempt_count, error_code)
        C->>C: Auto-triage: rule pack mismatch? data defect? version drift?
        C-->>U: Guided remediation (e.g., fix label fields, adjust lot split)
    else Partial success (batch)
        M-->>Q: Mixed result set
        Q->>C: Reconcile succeeded vs failed items; ensure idempotency on replays
    end
    end

    %% -------------------- READ/CONFIRM FROM METRC --------------------
    rect rgb(235,245,255)
    C->>M: GET/Sync for authoritative state (poll/webhook if available)
    M-->>C: Current objects (plants, packages, transfers, sales)
    C->>C: Drift detection & reconciliation<br/>• compare METRC vs internal ledger<br/>• create remediation tasks if divergence
    end

    %% -------------------- PUSH TO ERP (ONE-WAY) --------------------
    rect rgb(245,235,255)
    C->>C: Transform for ERP domain<br/>• COA/test summaries, COGS rollups<br/>• SKU/UPC↔batch/UID mapping table<br/>• GL/tax mappings (retailer-configured)
    C->>Q: Outbox (C→E) with idempotency_key
    Q->>E: Upsert master data, inventory movements, costs, sales summaries
    E-->>Q: 2xx (accepted)
    Q-->>C: Ack
    end

    %% -------------------- FAILURE MODES (ERP LEG) --------------------
    rect rgb(255,245,230)
    alt ERP down / 5xx / throttling
        Q-->>Q: Retry with backoff; respect rate limits
        Q->>C: Alert/metrics
    else Mapping errors (SKU/GL/tax)
        E-->>Q: 4xx + details
        Q->>C: Dead-letter + config task
        C-->>U: Prompt retailer to correct mappings (self-service)
    end
    end

    %% -------------------- CONTINUOUS GUARDRAILS --------------------
    Note over C,M: Guardrails (METRC side)<br/>• Pre-flight validation before POST<br/>• Idempotency keys per event<br/>• Versioned rule packs per state & license type<br/>• Canary rules + feature flags for regulatory changes<br/>• Scheduled METRC↔App reconciliation jobs
    Note over C,E: Guardrails (ERP side)<br/>• One-way sync; no ERP→METRC writes<br/>• PII minimization; scoped payloads<br/>• Referential integrity via mapping tables<br/>• Financial close alignment (period locks)<br/>• Audit trails & immutable logs

    %% -------------------- OBSERVABILITY & OPERATIONS --------------------
    par Telemetry
        C->>C: Tracing (event_id, idempotency_key, metrc_object_id)
    and Dashboards
        C->>U: Live status: queue depth, error rates, drift counts
    and Controls
        U->>C: Retry/resolve DLQs, revalidate with updated rules, requeue safely
    end