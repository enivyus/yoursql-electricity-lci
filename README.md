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
| DBMS | SQLite 3 · 9 ตาราง · CHECK / FK / trigger 2 ตัว / ดัชนี 3 ตัว |

## โครงสร้าง

```
db/lci.db              ฐานข้อมูลที่ผ่าน QA แล้ว (เปิดด้วย DB Browser for SQLite ได้)
data/*.csv             ข้อมูลทุกตาราง (UTF-8) ทุกแถวมี source_id
sql/01_schema.sql      DDL: 9 ตาราง, CHECK, FK, trigger (BR-05, FR-09), index
sql/02_load.py         นำเข้า CSV → SQLite ตามลำดับ FK และนับแถวที่ถูกปฏิเสธ
sql/03_queries.sql     Query Q01–Q27 ที่ใช้ตรวจ Requirement (บทที่ 6)
sql/04_test_br05.sql   ทดสอบว่าการแก้ค่าต้นทางถูกปฏิเสธ
sql/run_sql.py         ตัวรันไฟล์ .sql (กรณีไม่มี sqlite3 CLI)
scripts/build_data.py  ถอด SRC-08 Table 1 → CSV
scripts/build_stats.py ถอดสถิติ EPPO ทีละเซลล์ → CSV (+ results/stats_excluded.csv)
scripts/qa_review.py   ตรวจคุณภาพทุกแถว แล้วเปลี่ยนสถานะเป็น reviewed (results/qa_report.csv)
snapshots/             ไฟล์ต้นฉบับที่ดาวน์โหลด + SHA256SUMS.txt
results/               ผลการรันจริง
serving/               หัวข้อ 6.x: Cypher (LOAD CSV … MERGE), embedding, ทริปเปิลสำหรับ W14 Colab และผล (colab_results/)
docs/                  ERD, SRS ฉบับสมบูรณ์, สไลด์, โปสเตอร์
```

## รันซ้ำ

> ทำในโฟลเดอร์สำเนา: `build_stats.py` เขียนทับ `data/stat_observation.csv` (สถานะกลับเป็น unreviewed จนกว่าจะรัน `qa_review.py`) และ Query Q12 ใน `03_queries.sql` ทดลองเปลี่ยนสถานะ 1 แถว

```bash
python scripts/build_stats.py snapshots          # สร้าง data/stat_observation.csv จาก snapshot
python sql/02_load.py data new.db                # สร้างฐานข้อมูลใหม่จาก CSV
python scripts/qa_review.py new.db               # ตรวจคุณภาพ → qa_report.csv
python sql/run_sql.py new.db sql/03_queries.sql  # รัน Q01–Q27
```

## ย้อนดูหนึ่งแถวถึงต้นฉบับ (ตัวอย่าง)

```sql
SELECT e.exchange_id, f.name, e.amount_original, e.unit_original,
       s.source_id, s.title, e.location_in_source, e.snapshot_sha256, e.review_status
FROM lci_exchange e JOIN flow f USING (flow_id) JOIN source s USING (source_id)
WHERE f.name = 'CO2';
-- 21 | CO2 | 324,686,938 | kgCO2 | SRC-08 | Usapein, P.; Chavalparit, O. Life Cycle Assessment ... | Table 1 (p.5) แถว 21 | 9a6303c6... | reviewed
```

เปิด `snapshots/RECHECK-SRC08-…pdf` หน้า 5 Table 1 แถว CO2 จะเห็นค่า 324,686,938 kgCO2

## หมายเหตุเรื่อง snapshot ของ SRC-08

snapshot เดิม (2026-11-09) มี SHA-256 `9a6303c6…4a24f223` จาก URL เดิมของผู้เผยแพร่ซึ่งปัจจุบันใช้ไม่ได้แล้ว
ไฟล์ที่ดาวน์โหลดใหม่จาก DOI 10.1051/matecconf/201710305009 เมื่อ 2026-11-13 มี SHA-256 `d6dda381…2dfb4806`
ค่าทั้ง 31 แถวตรงกันทุกตัว (ตรวจด้วย `qa_review.py`) จึงเก็บไฟล์ใหม่เป็นหลักฐานการตรวจซ้ำ และไม่เขียนทับ hash เดิม

## สิทธิการใช้ข้อมูล

- SRC-08: บทความ Open Access ภายใต้ CC BY 4.0 (MATEC Web of Conferences 103, 05009, 2017)
- SRC-01: สถิติของสำนักงานนโยบายและแผนพลังงาน (สนพ.) สถานะสิทธิการเผยแพร่ซ้ำยังไม่ยืนยัน (unconfirmed) ใช้เพื่อการศึกษา
- โค้ดในที่เก็บนี้จัดทำเพื่อรายวิชา CN230

## ทีม

| ชื่อ | บทบาท |
|---|---|
| ชลันธร ศรีนวนจันทร์ | PM/BA · SQL Lead · QA Lead |
| สิทธิศักดิ์ มงคลสวัสดิ์ | Data Lead · Schema Lead |


