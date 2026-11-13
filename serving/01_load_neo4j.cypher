// CN230 S2-G01 · Ch.6.x Serving Layer · Neo4j 5.x
// วางไฟล์ CSV จาก data/ ไว้ในโฟลเดอร์ import ของ Neo4j ก่อนรัน · ยังไม่ได้ทดลอง: ทีมรันและบันทึกผลจริง
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.source_id IS UNIQUE;
CREATE CONSTRAINT process_id IF NOT EXISTS FOR (p:Process) REQUIRE p.process_id IS UNIQUE;
CREATE CONSTRAINT flow_id IF NOT EXISTS FOR (f:Flow) REQUIRE f.flow_id IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.location_id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///source.csv' AS row
MERGE (s:Source {source_id: row.source_id})
SET s.title = row.title, s.publisher = row.publisher, s.year = row.year, s.url = row.url,
    s.license_status = row.license_status;

LOAD CSV WITH HEADERS FROM 'file:///location.csv' AS row
MERGE (l:Location {location_id: toInteger(row.location_id)}) SET l.name = row.name, l.country = row.country;

LOAD CSV WITH HEADERS FROM 'file:///flow.csv' AS row
MERGE (f:Flow {flow_id: toInteger(row.flow_id)})
SET f.name = row.name, f.flow_type = row.flow_type, f.compartment = row.compartment;

// PROCESS.location_id -> (:Process)-[:LOCATED_IN]->(:Location) · PROCESS.source_id -> [:FROM_SOURCE]
LOAD CSV WITH HEADERS FROM 'file:///process.csv' AS row
MERGE (p:Process {process_id: toInteger(row.process_id)})
SET p.name = row.name, p.domain = row.domain, p.reporting_level = row.reporting_level,
    p.functional_unit = row.functional_unit, p.system_boundary = row.system_boundary,
    p.description = row.name + ' · FU: ' + row.functional_unit + ' · ' + row.system_boundary + ' · ' + row.allocation_method
WITH p, row
MATCH (l:Location {location_id: toInteger(row.location_id)}), (s:Source {source_id: row.source_id})
MERGE (p)-[:LOCATED_IN]->(l)
MERGE (p)-[:FROM_SOURCE]->(s);

// LCI_EXCHANGE (M:N) -> (:Process)-[:EXCHANGES {..}]->(:Flow) · source_id คงไว้บน relationship
LOAD CSV WITH HEADERS FROM 'file:///lci_exchange.csv' AS row
MATCH (p:Process {process_id: toInteger(row.process_id)})
MATCH (f:Flow {flow_id: toInteger(row.flow_id)})
MERGE (p)-[e:EXCHANGES {exchange_id: toInteger(row.exchange_id)}]->(f)
SET e.direction = row.direction, e.amount_original = row.amount_original,
    e.amount = CASE row.amount WHEN '' THEN null ELSE toFloat(row.amount) END,
    e.unit = row.unit_original, e.is_reference = (row.is_reference = '1'),
    e.review_status = row.review_status, e.source_id = row.source_id;

// ตรวจนับหลังโหลด: ต้องเท่ากับจำนวนแถว CSV (Source 10, Flow 29, Process 1, EXCHANGES 31)
MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label;
MATCH ()-[r:EXCHANGES]->() RETURN count(r) AS exchanges;
