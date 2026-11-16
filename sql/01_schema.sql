-- CN230 S2-G01 · Electricity & Power Generation · M3 BUILD
-- DBMS: SQLite 3 · DDL ตาม ERD แนวทางรายวิชา (6 ตาราง) + คอลัมน์ตาม DR-01..DR-08 ของ SRS Rev 0.2
PRAGMA foreign_keys = ON;

CREATE TABLE source (
  source_id        TEXT PRIMARY KEY CHECK (source_id GLOB 'SRC-[0-9][0-9]'),
  title            TEXT NOT NULL,
  publisher        TEXT NOT NULL,
  year             TEXT NOT NULL,                 -- ปี/ฉบับตามต้นฉบับ (DR-03)
  url              TEXT NOT NULL,
  source_ref       TEXT NOT NULL,                 -- source_id ย่อยใน 1.4 เช่น MATEC-103-05009-T1
  reporting_level  TEXT NOT NULL CHECK (reporting_level IN ('country','egat_system','organization','plant','reference_value')),
  license_status   TEXT NOT NULL CHECK (license_status IN ('confirmed','unconfirmed')),   -- DR-05
  license_note     TEXT
);

CREATE TABLE location (
  location_id  INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  country      TEXT NOT NULL
);

CREATE TABLE unit (
  unit_id         INTEGER PRIMARY KEY,
  symbol          TEXT NOT NULL UNIQUE,
  quantity        TEXT NOT NULL,                  -- energy, mass, volume, concentration
  base_symbol     TEXT NOT NULL,
  to_base_factor  REAL NOT NULL CHECK (to_base_factor > 0)   -- อัตราแปลงตายตัวเท่านั้น (1.2)
);

CREATE TABLE flow (
  flow_id          INTEGER PRIMARY KEY,
  name             TEXT NOT NULL UNIQUE,
  flow_type        TEXT NOT NULL CHECK (flow_type IN ('product','elementary','technosphere','waste')),
  compartment      TEXT CHECK (compartment IN ('air','water','soil','resource','technosphere')),
  default_unit_id  INTEGER REFERENCES unit(unit_id)
);

CREATE TABLE process (
  process_id          INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  domain              TEXT NOT NULL,
  reporting_level     TEXT NOT NULL CHECK (reporting_level IN ('country','egat_system','organization','plant')),
  reference_basis     TEXT NOT NULL,              -- Process Reference Basis (1.3)
  functional_unit     TEXT,
  system_boundary     TEXT,
  allocation_method   TEXT,
  data_period         TEXT NOT NULL DEFAULT 'ไม่ระบุ',   -- DR-03
  year_type           TEXT NOT NULL DEFAULT 'ไม่ระบุ' CHECK (year_type IN ('calendar','fiscal','ไม่ระบุ')),
  publication_year    INTEGER,
  location_id         INTEGER NOT NULL REFERENCES location(location_id),
  source_id           TEXT NOT NULL REFERENCES source(source_id)
);

CREATE TABLE lci_exchange (
  exchange_id       INTEGER PRIMARY KEY,
  process_id        INTEGER NOT NULL REFERENCES process(process_id),
  flow_id           INTEGER NOT NULL REFERENCES flow(flow_id),
  direction         TEXT NOT NULL CHECK (direction IN ('IN','OUT')),
  amount_original   TEXT NOT NULL,                -- DR-01 ค่าตามที่ปรากฏ รวมทศนิยม/คอมมา
  amount            REAL CHECK (amount IS NULL OR amount >= 0),   -- ค่าตัวเลข; NULL ถ้าอ่านไม่ได้ (BR-03)
  unit_id           INTEGER NOT NULL REFERENCES unit(unit_id),
  unit_original     TEXT NOT NULL,
  is_reference      INTEGER NOT NULL DEFAULT 0 CHECK (is_reference IN (0,1)),
  allocation_stage  TEXT NOT NULL CHECK (allocation_stage IN ('before','after','ไม่ระบุ')),   -- DR-06
  cited_document    TEXT,                         -- เอกสารที่ต้นฉบับอ้างอิง (DR-06)
  remark            TEXT,
  location_in_source TEXT NOT NULL,               -- DR-02 ตาราง/หน้า/แถว
  snapshot_file     TEXT NOT NULL,                -- DR-02
  snapshot_sha256   TEXT NOT NULL,
  retrieved_on      TEXT NOT NULL,
  review_status     TEXT NOT NULL DEFAULT 'unreviewed'
                    CHECK (review_status IN ('unreviewed','reviewed','held_context','conflict')),   -- DR-05
  source_id         TEXT NOT NULL REFERENCES source(source_id),
  CHECK (amount IS NOT NULL OR review_status = 'held_context')   -- ค่าที่อ่านไม่ได้ต้องถูกพักตรวจ
);

CREATE TABLE session_ctx (key TEXT PRIMARY KEY, value TEXT);

-- ดัชนีสำหรับ Query ที่ใช้บ่อย (W12 Indexing)
CREATE INDEX idx_exchange_process_flow ON lci_exchange(process_id, flow_id);
CREATE INDEX idx_exchange_status ON lci_exchange(review_status);

-- ===== สถิติไฟฟ้า (SRC-01) · เก็บแยกจาก LCI ตาม BR-01 =====
CREATE TABLE stat_observation (
  obs_id            INTEGER PRIMARY KEY,
  source_id         TEXT NOT NULL REFERENCES source(source_id),
  dataset_ref       TEXT NOT NULL,                -- เช่น EPPO-T05-02-02
  measure           TEXT NOT NULL CHECK (measure IN ('generation','installed_capacity','peak_demand','load_factor')),
  category          TEXT NOT NULL,                -- ชนิดเชื้อเพลิง หรือ ประเภทผู้ผลิต หรือ 'Total'
  category_kind     TEXT NOT NULL CHECK (category_kind IN ('fuel','producer','system_total')),
  reporting_level   TEXT NOT NULL CHECK (reporting_level IN ('country','egat_system','organization','plant')),
  frequency         TEXT NOT NULL CHECK (frequency IN ('yearly','monthly')),
  year_label        TEXT NOT NULL,                -- ป้ายปีตามต้นฉบับ (DR-03)
  year_ce           INTEGER NOT NULL,             -- ปี ค.ศ. ที่แปลงแล้ว
  month             INTEGER CHECK (month BETWEEN 1 AND 12),
  year_type         TEXT NOT NULL DEFAULT 'ไม่ระบุ' CHECK (year_type IN ('calendar','fiscal','ไม่ระบุ')),
  is_preliminary    INTEGER NOT NULL DEFAULT 0 CHECK (is_preliminary IN (0,1)),
  capacity_type     TEXT CHECK (capacity_type IN ('installed','contracted','ไม่ระบุ')),
  generation_basis  TEXT CHECK (generation_basis IN ('gross','net','ไม่ระบุ')),
  value_original    TEXT NOT NULL,
  value             REAL,
  value_flag        TEXT NOT NULL DEFAULT 'value' CHECK (value_flag IN ('value','blank')),   -- BR-03
  unit_id           INTEGER NOT NULL REFERENCES unit(unit_id),
  unit_original     TEXT NOT NULL,
  location_in_source TEXT NOT NULL,
  snapshot_file     TEXT NOT NULL,
  snapshot_sha256   TEXT NOT NULL,
  retrieved_on      TEXT NOT NULL,
  review_status     TEXT NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed','reviewed','held_context','conflict')),
  CHECK ((value IS NULL) = (value_flag = 'blank')),
  CHECK (frequency = 'yearly' OR month IS NOT NULL)
);
CREATE INDEX idx_stat_lookup ON stat_observation(measure, frequency, year_ce, category);

-- FR-09: one audit stream, retaining exchange_id for existing queries.
CREATE TABLE status_history (
  history_id INTEGER PRIMARY KEY,
  exchange_id INTEGER REFERENCES lci_exchange(exchange_id),
  obs_id INTEGER REFERENCES stat_observation(obs_id),
  source_id TEXT REFERENCES source(source_id),
  status_field TEXT NOT NULL CHECK (status_field IN ('review_status','license_status')),
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL CHECK (length(trim(changed_by)) > 0),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  CHECK ((exchange_id IS NOT NULL) + (obs_id IS NOT NULL) + (source_id IS NOT NULL) = 1),
  CHECK ((source_id IS NOT NULL) = (status_field = 'license_status')),
  CHECK (old_status <> new_status)
);

-- BR-05: source values, identity, context and provenance are immutable.
CREATE TRIGGER trg_lci_exchange_immutable BEFORE UPDATE ON lci_exchange
WHEN OLD.exchange_id IS NOT NEW.exchange_id
  OR OLD.process_id IS NOT NEW.process_id
  OR OLD.flow_id IS NOT NEW.flow_id
  OR OLD.direction IS NOT NEW.direction
  OR OLD.amount_original IS NOT NEW.amount_original
  OR OLD.amount IS NOT NEW.amount
  OR OLD.unit_id IS NOT NEW.unit_id
  OR OLD.unit_original IS NOT NEW.unit_original
  OR OLD.is_reference IS NOT NEW.is_reference
  OR OLD.allocation_stage IS NOT NEW.allocation_stage
  OR OLD.cited_document IS NOT NEW.cited_document
  OR OLD.remark IS NOT NEW.remark
  OR OLD.location_in_source IS NOT NEW.location_in_source
  OR OLD.snapshot_file IS NOT NEW.snapshot_file
  OR OLD.snapshot_sha256 IS NOT NEW.snapshot_sha256
  OR OLD.retrieved_on IS NOT NEW.retrieved_on
  OR OLD.source_id IS NOT NEW.source_id
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record is immutable; insert a new version');
END;
CREATE TRIGGER trg_lci_exchange_no_delete BEFORE DELETE ON lci_exchange
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record cannot be deleted');
END;
-- BEFORE INSERT also blocks REPLACE with recursive_triggers OFF.
CREATE TRIGGER trg_lci_exchange_no_replace BEFORE INSERT ON lci_exchange
WHEN EXISTS (SELECT 1 FROM lci_exchange WHERE exchange_id=NEW.exchange_id)
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record cannot be replaced');
END;

-- BR-05: source values, identity, context and provenance are immutable.
CREATE TRIGGER trg_stat_observation_immutable BEFORE UPDATE ON stat_observation
WHEN OLD.obs_id IS NOT NEW.obs_id
  OR OLD.source_id IS NOT NEW.source_id
  OR OLD.dataset_ref IS NOT NEW.dataset_ref
  OR OLD.measure IS NOT NEW.measure
  OR OLD.category IS NOT NEW.category
  OR OLD.category_kind IS NOT NEW.category_kind
  OR OLD.reporting_level IS NOT NEW.reporting_level
  OR OLD.frequency IS NOT NEW.frequency
  OR OLD.year_label IS NOT NEW.year_label
  OR OLD.year_ce IS NOT NEW.year_ce
  OR OLD.month IS NOT NEW.month
  OR OLD.year_type IS NOT NEW.year_type
  OR OLD.is_preliminary IS NOT NEW.is_preliminary
  OR OLD.capacity_type IS NOT NEW.capacity_type
  OR OLD.generation_basis IS NOT NEW.generation_basis
  OR OLD.value_original IS NOT NEW.value_original
  OR OLD.value IS NOT NEW.value
  OR OLD.value_flag IS NOT NEW.value_flag
  OR OLD.unit_id IS NOT NEW.unit_id
  OR OLD.unit_original IS NOT NEW.unit_original
  OR OLD.location_in_source IS NOT NEW.location_in_source
  OR OLD.snapshot_file IS NOT NEW.snapshot_file
  OR OLD.snapshot_sha256 IS NOT NEW.snapshot_sha256
  OR OLD.retrieved_on IS NOT NEW.retrieved_on
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record is immutable; insert a new version');
END;
CREATE TRIGGER trg_stat_observation_no_delete BEFORE DELETE ON stat_observation
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record cannot be deleted');
END;
-- BEFORE INSERT also blocks REPLACE with recursive_triggers OFF.
CREATE TRIGGER trg_stat_observation_no_replace BEFORE INSERT ON stat_observation
WHEN EXISTS (SELECT 1 FROM stat_observation WHERE obs_id=NEW.obs_id)
BEGIN
  SELECT RAISE(ABORT, 'BR-05: original record cannot be replaced');
END;

CREATE TRIGGER trg_lci_exchange_status_context BEFORE UPDATE OF review_status ON lci_exchange
WHEN OLD.review_status IS NOT NEW.review_status
BEGIN
  SELECT CASE WHEN
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='user'),0)=0 OR
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='reason'),0)=0
  THEN RAISE(ABORT, 'FR-09: nonempty user and reason required in session_ctx') END;
END;
CREATE TRIGGER trg_lci_exchange_status_log AFTER UPDATE OF review_status ON lci_exchange
WHEN OLD.review_status IS NOT NEW.review_status
BEGIN
  INSERT INTO status_history (exchange_id,status_field,old_status,new_status,changed_by,reason)
  VALUES (NEW.exchange_id,'review_status',OLD.review_status,NEW.review_status,
    (SELECT value FROM session_ctx WHERE key='user'),
    (SELECT value FROM session_ctx WHERE key='reason'));
END;

CREATE TRIGGER trg_stat_observation_status_context BEFORE UPDATE OF review_status ON stat_observation
WHEN OLD.review_status IS NOT NEW.review_status
BEGIN
  SELECT CASE WHEN
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='user'),0)=0 OR
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='reason'),0)=0
  THEN RAISE(ABORT, 'FR-09: nonempty user and reason required in session_ctx') END;
END;
CREATE TRIGGER trg_stat_observation_status_log AFTER UPDATE OF review_status ON stat_observation
WHEN OLD.review_status IS NOT NEW.review_status
BEGIN
  INSERT INTO status_history (obs_id,status_field,old_status,new_status,changed_by,reason)
  VALUES (NEW.obs_id,'review_status',OLD.review_status,NEW.review_status,
    (SELECT value FROM session_ctx WHERE key='user'),
    (SELECT value FROM session_ctx WHERE key='reason'));
END;

CREATE TRIGGER trg_source_status_context BEFORE UPDATE OF license_status ON source
WHEN OLD.license_status IS NOT NEW.license_status
BEGIN
  SELECT CASE WHEN
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='user'),0)=0 OR
    COALESCE((SELECT length(trim(value)) FROM session_ctx WHERE key='reason'),0)=0
  THEN RAISE(ABORT, 'FR-09: nonempty user and reason required in session_ctx') END;
END;
CREATE TRIGGER trg_source_status_log AFTER UPDATE OF license_status ON source
WHEN OLD.license_status IS NOT NEW.license_status
BEGIN
  INSERT INTO status_history (source_id,status_field,old_status,new_status,changed_by,reason)
  VALUES (NEW.source_id,'license_status',OLD.license_status,NEW.license_status,
    (SELECT value FROM session_ctx WHERE key='user'),
    (SELECT value FROM session_ctx WHERE key='reason'));
END;

CREATE TRIGGER trg_source_no_replace BEFORE INSERT ON source
WHEN EXISTS (SELECT 1 FROM source WHERE source_id=NEW.source_id)
BEGIN
  SELECT RAISE(ABORT, 'FR-09: source replacement would bypass audit');
END;
CREATE TRIGGER trg_source_identity BEFORE UPDATE OF source_id ON source
WHEN OLD.source_id IS NOT NEW.source_id
BEGIN
  SELECT RAISE(ABORT, 'FR-09: source identity is immutable');
END;
CREATE TRIGGER trg_source_no_delete BEFORE DELETE ON source
BEGIN
  SELECT RAISE(ABORT, 'FR-09: source cannot be deleted');
END;
CREATE TRIGGER trg_history_no_update BEFORE UPDATE ON status_history
BEGIN
  SELECT RAISE(ABORT, 'FR-09: audit history is append-only');
END;
CREATE TRIGGER trg_history_no_delete BEFORE DELETE ON status_history
BEGIN
  SELECT RAISE(ABORT, 'FR-09: audit history is append-only');
END;
CREATE TRIGGER trg_history_no_replace BEFORE INSERT ON status_history
WHEN EXISTS (SELECT 1 FROM status_history WHERE history_id=NEW.history_id)
BEGIN
  SELECT RAISE(ABORT, 'FR-09: audit history cannot be replaced');
END;
