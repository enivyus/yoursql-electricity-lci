// CN230 S2-G01 YourSQL · หัวข้อ 6.x · RDB → Property Graph (Neo4j 5 / AuraDB Free)
// อ่าน CSV จาก GitHub โดยตรง (ตรึงที่ commit 3460b42) จึงไม่ต้องวางไฟล์ในโฟลเดอร์ import
// ถ้าออฟไลน์: คัดลอก data/*.csv ไปโฟลเดอร์ import ของ instance แล้วใช้ :param base => 'file:///'
// วิธีรัน: เปิด Query ใน Neo4j Desktop หรือ Aura แล้ววางทั้งไฟล์ (หลายคำสั่งคั่นด้วย ;)
// รันจริง: Neo4j Desktop 2.3.1 · Cypher 25 · 16 พ.ย. 2569 · ผลอยู่ใน serving/neo4j_results/

:param base => 'https://raw.githubusercontent.com/enivyus/yoursql-electricity-lci/3460b42d9b624d06fb460a72ef30e7d441077fbe/data/';

// ---------- 0) ล้างของเก่า (รันซ้ำได้) ----------
MATCH (n) DETACH DELETE n;

// ---------- 1) Constraint = PK ----------
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.source_id IS UNIQUE;
CREATE CONSTRAINT process_id IF NOT EXISTS FOR (p:Process) REQUIRE p.process_id IS UNIQUE;
CREATE CONSTRAINT flow_id IF NOT EXISTS FOR (f:Flow) REQUIRE f.flow_id IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.location_id IS UNIQUE;

// ---------- 2) ตาราง → Label ----------
LOAD CSV WITH HEADERS FROM $base + 'source.csv' AS row
MERGE (s:Source {source_id: row.source_id})
SET s.title = row.title, s.publisher = row.publisher, s.year = row.year,
    s.url = row.url, s.license_status = row.license_status;

LOAD CSV WITH HEADERS FROM $base + 'location.csv' AS row
MERGE (l:Location {location_id: toInteger(row.location_id)})
SET l.name = row.name, l.country = row.country;

LOAD CSV WITH HEADERS FROM $base + 'flow.csv' AS row
MERGE (f:Flow {flow_id: toInteger(row.flow_id)})
SET f.name = row.name, f.flow_type = row.flow_type, f.compartment = row.compartment;

// ---------- 3) FK → ความสัมพันธ์ ----------
LOAD CSV WITH HEADERS FROM $base + 'process.csv' AS row
MERGE (p:Process {process_id: toInteger(row.process_id)})
SET p.name = row.name, p.domain = row.domain, p.reporting_level = row.reporting_level,
    p.functional_unit = row.functional_unit, p.system_boundary = row.system_boundary
WITH p, row
MATCH (l:Location {location_id: toInteger(row.location_id)})
MATCH (s:Source {source_id: row.source_id})
MERGE (p)-[:LOCATED_IN]->(l)
MERGE (p)-[:FROM_SOURCE]->(s);

// ---------- 4) ตาราง M:N LCI_EXCHANGE → ความสัมพันธ์ที่มีคุณสมบัติ ----------
LOAD CSV WITH HEADERS FROM $base + 'lci_exchange.csv' AS row
MATCH (p:Process {process_id: toInteger(row.process_id)})
MATCH (f:Flow {flow_id: toInteger(row.flow_id)})
MERGE (p)-[e:EXCHANGES {exchange_id: toInteger(row.exchange_id)}]->(f)
SET e.direction = row.direction,
    e.amount_original = row.amount_original,
    e.amount = CASE row.amount WHEN '' THEN null ELSE toFloat(row.amount) END,
    e.unit = row.unit_original,
    e.location_in_source = row.location_in_source,
    e.snapshot_sha256 = row.snapshot_sha256,
    e.source_id = row.source_id,
    e.review_status = row.review_status;

// สถานะใน CSV เป็นค่าก่อน QA → อัปเดตตามประวัติ FR-09 (status_history.csv) ให้ตรงกับ db/lci.db
LOAD CSV WITH HEADERS FROM $base + 'status_history.csv' AS row
WITH row WHERE row.exchange_id <> ''
MATCH ()-[e:EXCHANGES {exchange_id: toInteger(row.exchange_id)}]->()
SET e.review_status = row.new_status;

// ---------- 5) ตรวจนับ (คาดหวัง: Flow 29, Location 1, Process 1, Source 10 = 41 โหนด) ----------
MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label;

// คาดหวัง: EXCHANGES 31, FROM_SOURCE 1, LOCATED_IN 1 = 33 ความสัมพันธ์
MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS n ORDER BY rel;

// คาดหวัง: reviewed 26, held_context 5 (ตรงกับ SQLite)
MATCH ()-[e:EXCHANGES]->() RETURN e.review_status AS status, count(*) AS n ORDER BY status;

// ---------- 6) 3 คำถามเทียบกับ SQL JOIN (หัวข้อ 5 บนโปสเตอร์) ----------
// Q1 โรงไฟฟ้าปล่อย CO2 เท่าไร · คาดหวัง 1 แถว: 324,686,938 kgCO2
MATCH (p:Process)-[e:EXCHANGES]->(f:Flow {name: 'CO2'})
RETURN p.name, e.amount_original, e.unit, e.review_status;

// Q2 แถวนี้มาจากแหล่งใด · ตามรอยถึงหน้า/แถวในต้นฉบับและ hash
MATCH (p:Process)-[:FROM_SOURCE]->(s:Source), (p)-[e:EXCHANGES]->(f:Flow {name: 'CO2'})
RETURN s.source_id, s.title, e.location_in_source, e.snapshot_sha256;

// Q3 อะไรบ้างที่ปล่อยออกจากโรงไฟฟ้า · คาดหวัง 13 แถว (exchange 19–31)
MATCH (p:Process)-[e:EXCHANGES {direction: 'OUT'}]->(f:Flow)
RETURN e.exchange_id, f.name, e.amount_original, e.unit, e.review_status
ORDER BY e.exchange_id;

// ---------- 7) ภาพกราฟสำหรับแคปใส่โปสเตอร์ ----------
MATCH path = (l:Location)<-[:LOCATED_IN]-(p:Process)-[:FROM_SOURCE]->(s:Source)
OPTIONAL MATCH out = (p)-[e:EXCHANGES {direction: 'OUT'}]->(f:Flow)
RETURN path, out;
