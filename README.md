# YourSQL · Thailand Electricity & Power Generation LCI Database

CN230 Database Systems × MTEC — Thailand LCI Data Acquisition & Database Engineering Challenge 2026
ทีม **YourSQL (S2-G01, Section 2)** · Domain: Electricity & Power Generation

> *Build data that someone else can trust.* ทุกแถวในฐานข้อมูลตอบได้ว่า "มาจากไหน" ด้วยรหัสแหล่ง (SRC-xx), ตำแหน่งในต้นฉบับ และ SHA-256 ของไฟล์ snapshot

| | |
|---|---|
| ข้อมูลที่ผ่าน Quality Gate | **870 แถว** (reviewed) จากทั้งหมด 888 แถว |
| LCI ระดับโรงไฟฟ้า | 26 แถว · SRC-08 Usapein & Chavalparit (2017) โรงไฟฟ้า CHP ก๊าซธรรมชาติ (CC BY 4.0) |
| สถิติไฟฟ้าระบบ กฟผ. | 844 ค่า · SRC-01 สนพ. (EPPO) ตาราง 5.1-1, 5.2-2, 5.2-5 ปี 1986–2026 |
| พักตรวจ / ค่าว่าง | 5 แถว held_context · 13 ค่า blank (ไม่นับ) |
| ประวัติการเปลี่ยนสถานะ | 870 รายการ (LCI 26 + สถิติ 844) |
| DBMS | SQLite 3 · 9 ตาราง · 18 trigger · 12 FK · ดัชนี 3 ตัว |

## โครงสร้าง

```
db/lci.db                 ฐานข้อมูลที่ผ่าน QA แล้ว (เปิดด้วย DB Browser for SQLite ได้)
data/*.csv                ข้อมูลนำเข้า 7 ตาราง (สถานะก่อน QA) ทุกแถวมี source_id
data/status_history.csv   ประวัติการเปลี่ยนสถานะ 870 รายการที่ export จาก db/lci.db (ไม่ใช่อินพุต)
sql/01_schema.sql         DDL: 9 ตาราง, CHECK, FK, trigger BR-05 / FR-09, ดัชนี
sql/02_load.py            ตรวจทั้งชุดก่อนสร้างฐานข้อมูลใหม่ (FR-08) และปฏิเสธทั้งชุดเมื่อพบข้อผิดพลาด
sql/03_queries.sql        Query Q01–Q27 ที่ใช้ตรวจ Requirement (บทที่ 6)
sql/04_test_br05.sql      ทดสอบว่าการแก้ค่าต้นทางถูกปฏิเสธ (คาดหวัง Error)
sql/run_sql.py            ตัวรันไฟล์ .sql (กรณีไม่มี sqlite3 CLI)
scripts/build_data.py     ถอด SRC-08 Table 1 → CSV
scripts/build_stats.py    ถอดสถิติ EPPO ทีละเซลล์ → CSV (+ results/stats_excluded.csv)
scripts/qa_review.py      ตรวจคุณภาพทุกแถว แล้วเปลี่ยนสถานะพร้อมบันทึกประวัติ (results/qa_report.csv)
tests/test_integrity.py   Automated tests 16 ชุด (BR-05, FR-08, FR-09, QA, Q01–Q27)
snapshots/                ไฟล์ต้นฉบับที่ดาวน์โหลด + SHA256SUMS.txt
results/                  ผลการรันจริง และ pdf_recheck.csv (เทียบค่า SRC-08 ทั้ง 31 รายการกับ PDF)
serving/                  หัวข้อ 6.x: Cypher (LOAD CSV … MERGE) + ผลรัน Neo4j (neo4j_results/), embedding, ทริปเปิลสำหรับ W14 Colab และผล (colab_results/)
docs/                     ERD และ SRS ฉบับสมบูรณ์
```

## รันซ้ำ

> ตัวนำเข้าไม่เขียนทับไฟล์ที่มีอยู่แล้ว ให้ระบุชื่อฐานข้อมูลใหม่ทุกครั้ง

```bash
python sql/02_load.py data new.db --snapshots snapshots   # ตรวจ hash, header, ชนิดข้อมูล, FK, หน่วย แล้วสร้างฐานข้อมูลใหม่
python scripts/qa_review.py new.db                        # ตรวจคุณภาพ เปลี่ยนสถานะ และบันทึกประวัติ 870 รายการ
python sql/run_sql.py new.db sql/03_queries.sql           # รัน Q01–Q27
python -m unittest discover -s tests -v                   # Automated tests 16 ชุด (ใช้ฐานข้อมูลชั่วคราว)
```

ถ้า CSV ผิดรูปแบบ, hash ของ snapshot ไม่ตรง, หน่วยไม่รองรับ หรือ FK ไม่ครบ ตัวนำเข้าจะปฏิเสธทั้งชุด แสดงเหตุผลรายแถว และไม่สร้างไฟล์ฐานข้อมูล

## เปลี่ยนสถานะพร้อมบันทึกประวัติ (FR-09)

ตั้งผู้เปลี่ยนและเหตุผล เปลี่ยนสถานะ แล้วล้างค่าใน transaction เดียวกัน ถ้าไม่มีผู้เปลี่ยนหรือเหตุผล trigger จะปฏิเสธ

```sql
PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;
INSERT OR REPLACE INTO session_ctx VALUES ('user','reviewer'),('reason','verified against source');
UPDATE stat_observation SET review_status='reviewed' WHERE obs_id=1;
DELETE FROM session_ctx;
COMMIT;
```

ค่าต้นทางทุกคอลัมน์ของ `lci_exchange` และ `stat_observation` แก้ ลบ หรือเขียนทับไม่ได้ (BR-05) เปลี่ยนได้เฉพาะ `review_status`
ประวัติใน `status_history` แก้หรือลบไม่ได้ trigger เป็นการควบคุมความถูกต้องของข้อมูล ไม่ใช่ระบบยืนยันตัวตน

## ย้อนดูหนึ่งแถวถึงต้นฉบับ (ตัวอย่าง)

```sql
SELECT e.exchange_id, f.name, e.amount_original, e.unit_original,
       s.source_id, s.title, e.location_in_source, e.snapshot_sha256, e.review_status
FROM lci_exchange e JOIN flow f USING (flow_id) JOIN source s USING (source_id)
WHERE f.name = 'CO2';
-- 21 | CO2 | 324,686,938 | kgCO2 | SRC-08 | Usapein, P.; Chavalparit, O. Life Cycle Assessment ... | Table 1 (p.5) แถว 21 | d6dda381... | reviewed
```

เปิด `snapshots/RECHECK-SRC08-20261113_matecconf_iscee2017_05009.pdf` หน้า 5 Table 1 แถว CO2 จะเห็นค่า 324,686,938 kgCO2

## RDB → Property Graph (Neo4j)

รัน `serving/01_load_neo4j.cypher` บน Neo4j Desktop 2.3.1 (Cypher 25) เมื่อ 16 พ.ย. 2569 สคริปต์อ่าน CSV จาก GitHub โดยตรงและอัปเดตสถานะตาม `status_history.csv`

| ตรวจ | ผล |
|---|---|
| โหนด | 41 (Source 10 · Flow 29 · Process 1 · Location 1) ตรงกับจำนวนแถว CSV |
| ความสัมพันธ์ | 33 (EXCHANGES 31 · FROM_SOURCE 1 · LOCATED_IN 1) |
| สถานะ | reviewed 26 · held_context 5 ตรงกับ `db/lci.db` |
| Q1 CO2 | 324,686,938 kgCO2 (reviewed) |
| Q2 ที่มา | SRC-08 · Table 1 (p.5) แถว 21 · SHA-256 d6dda381… |
| Q3 สิ่งที่ปล่อยออก | 13 รายการ (exchange 19–31) เท่ากับ SQL |

ภาพผลและกราฟอยู่ใน `serving/neo4j_results/`

## หมายเหตุเรื่อง snapshot ของ SRC-08 (รุ่น RECHECK-20261116)

snapshot เดิม (2026-11-09) มี SHA-256 `9a6303c6…4a24f223` จาก URL เดิมของผู้เผยแพร่ซึ่งปัจจุบันใช้ไม่ได้ และไฟล์นั้นไม่มีใน repository
จึงดาวน์โหลดใหม่จาก DOI 10.1051/matecconf/201710305009 เมื่อ 2026-11-13 ได้ SHA-256 `d6dda381…2dfb4806`
ค่าตัวเลขและหน่วยทั้ง 31 รายการตรงกับ CSV เดิมทุกตัว (`results/pdf_recheck.csv`) ข้อมูล LCI ในรุ่นนี้จึงอ้างไฟล์ใหม่
เปลี่ยนเฉพาะ `snapshot_file`, `snapshot_sha256` และ `retrieved_on` ค่าข้อมูลไม่เปลี่ยน
รุ่นก่อนหน้า (อ้าง hash เดิม) ยังดูได้ใน Git history ที่ commit `a52883f`

## สิทธิการใช้ข้อมูล

- SRC-08: บทความ Open Access ภายใต้ CC BY 4.0 (MATEC Web of Conferences 103, 05009, 2017)
- SRC-01: สถิติของสำนักงานนโยบายและแผนพลังงาน (สนพ.) สถานะสิทธิการเผยแพร่ซ้ำยังไม่ยืนยัน (unconfirmed) ใช้เพื่อการศึกษา
- โค้ดในที่เก็บนี้จัดทำเพื่อรายวิชา CN230

## ทีม

| ชื่อ | บทบาท |
|---|---|
| ชลันธร ศรีนวนจันทร์ | PM/BA · SQL Lead · QA Lead |
| สิทธิศักดิ์ มงคลสวัสดิ์ | Data Lead · Schema Lead |
