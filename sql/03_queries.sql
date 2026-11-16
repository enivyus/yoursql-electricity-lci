-- CN230 S2-G01 · M3 · Query ที่ตอบ Requirement (ใช้ในตาราง Traceability บทที่ 6)
.headers on
.mode column

-- Q01 · DR-06 · นำเข้า LCI Exchange ของ SRC-08 ครบ 29 รายการ (Table 1) + Reference Flow 2 รายการ
SELECT COUNT(*) AS table1_rows FROM lci_exchange WHERE source_id='SRC-08' AND location_in_source LIKE 'Table 1%';
SELECT COUNT(*) AS reference_rows FROM lci_exchange WHERE location_in_source LIKE 'ข้อความ%';

-- Q02 · DR-06 · รายการที่เป็นความเข้มข้น/รูปแบบตัวเลขผิดปกติ ต้องอยู่ในสถานะพักไว้รอตรวจบริบท
SELECT e.exchange_id, f.name, e.amount_original, e.unit_original, e.review_status
FROM lci_exchange e JOIN flow f ON f.flow_id=e.flow_id
WHERE e.unit_original='mg/l' OR e.amount IS NULL;

-- Q03 · DR-02 · ค่าที่ขาด snapshot หรือตำแหน่งในแหล่ง (คาดหวัง 0)
SELECT COUNT(*) AS missing_provenance FROM lci_exchange
WHERE snapshot_file IS NULL OR snapshot_sha256 IS NULL OR location_in_source IS NULL OR source_id IS NULL;

-- Q04 · DR-01 · ค่าตัวเลขตรงกับค่าต้นฉบับทุกแถวที่แปลงได้ (คาดหวัง 0 แถวไม่ตรง)
SELECT COUNT(*) AS mismatch FROM lci_exchange
WHERE amount IS NOT NULL AND CAST(REPLACE(amount_original, ',', '') AS REAL) <> amount;

-- Q05 · BR-03 · ค่าที่อ่านไม่ได้ต้องไม่ถูกแปลงเป็น 0 (คาดหวัง 0)
SELECT COUNT(*) AS blank_to_zero FROM lci_exchange WHERE amount = 0;

-- Q06 · BR-02 · ผลรวมต่อหน่วยฐาน: แต่ละกลุ่มมีหน่วยฐานเดียว (ไม่ปน MJ กับ kg)
SELECT u.quantity, u.base_symbol, COUNT(*) AS n, ROUND(SUM(e.amount*u.to_base_factor),3) AS total_base
FROM lci_exchange e JOIN unit u ON u.unit_id=e.unit_id
WHERE e.review_status <> 'held_context' AND e.direction='IN'
GROUP BY u.quantity, u.base_symbol;

-- Q07 · FR-04 · สรุป Exchange ขาเข้า/ขาออกของ Process CHP แยกตามปลายทางและสถานะ
SELECT e.direction, COALESCE(f.compartment,'-') AS compartment, f.flow_type, e.review_status, COUNT(*) AS n
FROM lci_exchange e JOIN flow f ON f.flow_id=e.flow_id
WHERE e.process_id=1
GROUP BY e.direction, f.compartment, f.flow_type, e.review_status
ORDER BY e.direction, compartment;

-- Q08 · FR-02 · รายละเอียดของรายการ CO2 พร้อม Provenance และสถานะ
SELECT e.exchange_id, f.name AS flow, e.amount_original, e.unit_original, p.reporting_level,
       e.source_id, s.source_ref, e.location_in_source, e.snapshot_file, e.review_status, s.license_status
FROM lci_exchange e JOIN flow f ON f.flow_id=e.flow_id JOIN process p ON p.process_id=e.process_id
JOIN source s ON s.source_id=e.source_id WHERE f.name='CO2';

-- Q09 · FR-06 · ชุดข้อมูลสำหรับส่งออก (ค่าเริ่มต้นไม่รวมรายการพักตรวจ) พร้อม source_id และสิทธิ
SELECT COUNT(*) AS export_rows, SUM(s.license_status IS NULL) AS missing_license
FROM lci_exchange e JOIN source s ON s.source_id=e.source_id
WHERE e.review_status NOT IN ('held_context','conflict');

-- Q10 · BR-01 · Exchange ทุกแถวอยู่ใน Process ระดับการรายงานเดียว (คาดหวัง 1 ระดับ)
SELECT p.reporting_level, COUNT(*) AS n FROM lci_exchange e JOIN process p ON p.process_id=e.process_id
GROUP BY p.reporting_level;

-- Q11 · DR-05 · สถานะการทบทวนแยกจากสถานะสิทธิ (นับรายการตามคู่สถานะ)
SELECT s.source_id, s.license_status, e.review_status, COUNT(*) AS n
FROM lci_exchange e JOIN source s ON s.source_id=e.source_id GROUP BY 1,2,3;

-- Q12 · FR-09 + BR-05 · เปลี่ยนสถานะ 1 รายการ แล้วมีประวัติ ค่าข้อมูลไม่เปลี่ยน (ทดสอบใน transaction แล้ว ROLLBACK)
BEGIN;
INSERT OR REPLACE INTO session_ctx VALUES ('user','QA Lead'),('reason','ทดสอบ FR-09');
UPDATE lci_exchange SET review_status=CASE WHEN review_status='reviewed' THEN 'unreviewed' ELSE 'reviewed' END WHERE exchange_id=19;
SELECT history_id, exchange_id, old_status, new_status, changed_by, reason FROM status_history WHERE exchange_id=19 ORDER BY history_id;
SELECT exchange_id, amount_original, review_status FROM lci_exchange WHERE exchange_id=19;
ROLLBACK;

-- Q13 · DR-04 / 2.5 · ช่องบริบทที่แหล่งไม่ระบุถูกบันทึกเป็น "ไม่ระบุ" ไม่ใช่ค่าว่าง
SELECT data_period, year_type, COUNT(*) AS n FROM process GROUP BY 1,2;

-- Q14 · Index (W12) · แผนการ Query ใช้ดัชนี idx_exchange_process_flow
EXPLAIN QUERY PLAN
SELECT f.name, e.amount FROM lci_exchange e JOIN flow f ON f.flow_id=e.flow_id WHERE e.process_id=1 AND e.flow_id=19;

-- ===== สถิติไฟฟ้า SRC-01 (EPPO) =====
-- Q15 · FR-01 · กรองการผลิตไฟฟ้ารายปีตามปีและชนิดเชื้อเพลิง (ตัวอย่าง: ก๊าซธรรมชาติ 2021–2025)
SELECT year_ce, category, value AS gwh FROM stat_observation
WHERE dataset_ref='EPPO-T05-02-02' AND measure='generation' AND category='Natural Gas' AND year_ce BETWEEN 2021 AND 2025
ORDER BY year_ce;

-- Q16 · FR-01 · กรองตามเดือนและเชื้อเพลิง และเมื่อไม่พบข้อมูลต้องได้ 0 แถว (ตัวอย่าง: ก.ย. 2026 ยังไม่มีข้อมูล)
SELECT COUNT(*) AS rows_sep_2026 FROM stat_observation
WHERE dataset_ref='EPPO-T05-02-02M' AND year_ce=2026 AND month=9;

-- Q17 · FR-01 · กรองกำลังผลิตติดตั้งตามประเภทผู้ผลิต (ปี 2025)
SELECT category, value AS mw, capacity_type FROM stat_observation
WHERE measure='installed_capacity' AND year_ce=2025 ORDER BY value DESC;

-- Q18 · FR-03 / BR-08 · อนุกรมเวลารายปี ไม่รวมปีที่เป็นข้อมูลเบื้องต้น (ปีล่าสุดต้องเป็น 2025)
SELECT MIN(year_ce) AS first_year, MAX(year_ce) AS last_year, COUNT(*) AS n_years FROM stat_observation
WHERE dataset_ref='EPPO-T05-02-02' AND category='Total' AND is_preliminary=0;

-- Q19 · BR-08 · ข้อมูลปี 2026 ทุกแถวเป็นข้อมูลเบื้องต้นและเป็นรายเดือนเท่านั้น (คาดหวัง yearly = 0)
SELECT frequency, is_preliminary, COUNT(*) AS n FROM stat_observation WHERE year_ce=2026 GROUP BY 1,2;

-- Q20 · DR-03 · ป้ายปีตามต้นฉบับแยกจากปี ค.ศ. และไม่มีแถวที่ขาดบริบทเวลา (คาดหวัง 0)
SELECT COUNT(*) AS missing_time_context FROM stat_observation
WHERE year_label IS NULL OR year_ce IS NULL OR frequency IS NULL OR year_type IS NULL;

-- Q21 · DR-04 · ฐานการผลิต gross/net ของ 5.2-5Y ตามหมายเหตุของแหล่ง (ช่วงที่ไม่ระบุ = "ไม่ระบุ")
SELECT generation_basis, MIN(year_ce) AS from_year, MAX(year_ce) AS to_year, COUNT(*) AS n
FROM stat_observation WHERE dataset_ref='EPPO-T05-02-05' AND measure='generation' GROUP BY 1 ORDER BY 2;

-- Q22 · BR-03 · ค่าว่างในต้นฉบับเก็บเป็น blank ไม่ถูกแปลงเป็น 0
SELECT dataset_ref, year_ce, month, category, value_original, value_flag FROM stat_observation WHERE value_flag='blank' ORDER BY 1,2,3 LIMIT 5;
SELECT COUNT(*) AS blank_rows FROM stat_observation WHERE value_flag='blank';

-- Q23 · BR-04 / FR-07 · เทียบยอดรายปี 2025 (5.2-2Y) กับผลรวม 12 เดือน 2025 (5.2-2 รายเดือน) ต่อเชื้อเพลิง
WITH y AS (SELECT category, value FROM stat_observation WHERE dataset_ref='EPPO-T05-02-02' AND year_ce=2025),
     m AS (SELECT category, SUM(value) AS value, COUNT(*) AS months FROM stat_observation WHERE dataset_ref='EPPO-T05-02-02M' AND year_ce=2025 GROUP BY category)
SELECT y.category, ROUND(y.value,3) AS yearly, ROUND(m.value,3) AS sum_monthly, m.months,
  CASE WHEN ABS(y.value-m.value) = 0 THEN 'ตรงกัน'
       WHEN ABS(y.value-m.value) <= 0.0005 THEN 'ต่างเพราะปัดเศษ' ELSE 'ต่างกัน' END AS status
FROM y JOIN m USING (category) ORDER BY y.category;

-- Q24 · BR-02 / BR-04 · การผลิตรวม 5.2-2Y เทียบกับ 5.2-5Y: ฐานการผลิตไม่ตรงกัน จึงต้องได้ "เปรียบเทียบไม่ได้"
SELECT a.year_ce, ROUND(a.value,1) AS gen_5_2_2, ROUND(b.value,1) AS gen_5_2_5, a.generation_basis AS basis_a, b.generation_basis AS basis_b,
  CASE WHEN a.generation_basis = b.generation_basis AND a.generation_basis <> 'ไม่ระบุ' THEN 'เทียบได้' ELSE 'เปรียบเทียบไม่ได้' END AS status
FROM stat_observation a JOIN stat_observation b ON a.year_ce=b.year_ce
WHERE a.dataset_ref='EPPO-T05-02-02' AND a.category='Total' AND b.dataset_ref='EPPO-T05-02-05' AND b.measure='generation' AND a.year_ce IN (2008, 2017, 2025);

-- Q25 · BR-01 · ไม่มี Query ใดรวม stat_observation กับ lci_exchange · ระดับการรายงานของสถิติ
SELECT reporting_level, COUNT(*) AS n FROM stat_observation GROUP BY 1;

-- Q26 · DR-02 · สถิติทุกแถวมีตำแหน่งเซลล์และ snapshot (คาดหวัง 0)
SELECT COUNT(*) AS missing_provenance FROM stat_observation WHERE location_in_source IS NULL OR snapshot_sha256 IS NULL;

-- Q27 · Index · แผน Query ของ FR-01 ใช้ idx_stat_lookup
EXPLAIN QUERY PLAN SELECT value FROM stat_observation WHERE measure='generation' AND frequency='yearly' AND year_ce=2025 AND category='Total';
