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

-- FR-09: ประวัติการเปลี่ยนสถานะ (ค่าข้อมูลไม่เปลี่ยน)
CREATE TABLE status_history (
  history_id   INTEGER PRIMARY KEY,
  exchange_id  INTEGER NOT NULL REFERENCES lci_exchange(exchange_id),
  old_status   TEXT NOT NULL,
  new_status   TEXT NOT NULL,
  changed_by   TEXT NOT NULL,
  changed_at   TEXT NOT NULL DEFAULT (datetime('now')),
  reason       TEXT NOT NULL
);

CREATE TRIGGER trg_status_log
AFTER UPDATE OF review_status ON lci_exchange
WHEN OLD.review_status <> NEW.review_status
BEGIN
  INSERT INTO status_history (exchange_id, old_status, new_status, changed_by, reason)
  VALUES (NEW.exchange_id, OLD.review_status, NEW.review_status,
          COALESCE((SELECT value FROM session_ctx WHERE key='user'),'unknown'),
          COALESCE((SELECT value FROM session_ctx WHERE key='reason'),'ไม่ระบุ'));
END;

-- ห้ามแก้ค่าข้อมูลต้นฉบับหลังนำเข้า (BR-05)
CREATE TRIGGER trg_no_value_edit
BEFORE UPDATE OF amount_original, amount, unit_id ON lci_exchange
BEGIN
  SELECT RAISE(ABORT, 'BR-05: ห้ามแก้ค่าต้นทาง ให้นำเข้าเป็นรุ่นใหม่แทน');
END;

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
