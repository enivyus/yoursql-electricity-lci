"""QA review pass (M4) · S2-G01 YourSQL
ตรวจข้อมูลก่อนเปลี่ยนสถานะเป็น reviewed (Quality Gate: Accepted · Unique · Verified · Traceable)
  1) SRC-08: เทียบ amount_original ทั้ง 29+2 แถวกับข้อความ Table 1 / หัวข้อ 3.2 ของ PDF ที่ดาวน์โหลดใหม่ 2026-11-13
  2) SRC-01 5.2-2 / 5.1-1: ผลรวมรายเชื้อเพลิง/รายผู้ผลิต ต้องเท่ากับ Total ของต้นฉบับ (คลาด ≤ 0.1% หรือ ≤ 1 หน่วย)
  3) SRC-01 5.2-5: load factor ต้องสอดคล้องกับ generation / (peak × ชั่วโมง) (คลาด ≤ 1 จุดร้อยละ)
  4) ไม่มีแถวซ้ำ และทุกแถวมี source_id + ตำแหน่ง + snapshot
แถวที่ผ่านทุกข้อ → review_status = 'reviewed' · แถว held_context และค่า blank ไม่เปลี่ยน
ใช้: python qa_review.py lci.db  → เขียน qa_report.csv
"""
import calendar, csv, sqlite3, sys

DB = sys.argv[1] if len(sys.argv) > 1 else "lci.db"
c = sqlite3.connect(DB)
report = []

# ---- 1) SRC-08 ค่าที่อ่านจาก PDF (Table 1 p.5 และหัวข้อ 3.2 p.7) วันที่ 2026-11-13
PDF_VALUES = {
 1:"5,615,021", 2:"1,098,153", 3:"1,200", 4:"400", 5:"125", 6:"1.00E-04", 7:"240", 8:"144", 9:"35",
 10:"5", 11:"1.5", 12:"5", 13:"1", 14:"6", 15:"1.5", 16:"1.5", 17:"6", 18:"1",
 19:"21,030", 20:"15,1361", 21:"324,686,938", 22:"40,460", 23:"6.09", 24:"52", 25:"25", 26:"1,646",
 27:"7,850", 28:"1,650", 29:"480", 30:"727,696", 31:"259,200",
}
lci_ok = []
for eid, orig, st, src, loc, snap in c.execute(
        "SELECT exchange_id, amount_original, review_status, source_id, location_in_source, snapshot_sha256 FROM lci_exchange"):
    match = PDF_VALUES.get(eid) == orig
    traced = bool(src and loc and snap)
    passed = match and traced and st == "unreviewed"
    report.append(["lci_exchange", eid, "SRC-08 PDF recheck", "pass" if match else "FAIL",
                   "held_context คงเดิม" if st == "held_context" else ("→ reviewed" if passed else "ไม่เปลี่ยน")])
    if passed: lci_ok.append(eid)

# ---- 2) ผลรวมเท่ากับ Total
stat_fail = set()
def sum_check(ds, measure):
    rows = c.execute("""SELECT year_ce, COALESCE(month,0),
        SUM(CASE WHEN category_kind<>'system_total' THEN value END),
        MAX(CASE WHEN category_kind='system_total' THEN value END)
        FROM stat_observation WHERE dataset_ref=? AND measure=? GROUP BY 1,2""", (ds, measure)).fetchall()
    for y, m, s, t in rows:
        ok = s is not None and t is not None and (abs(s - t) <= 1 or abs(s - t) / t <= 0.001)
        report.append(["stat_observation", f"{ds} {y}-{m:02d}", "sum = Total", "pass" if ok else "FAIL", f"sum={s:.2f} total={t}"])
        if not ok:
            for (oid,) in c.execute("SELECT obs_id FROM stat_observation WHERE dataset_ref=? AND measure=? AND year_ce=? AND COALESCE(month,0)=?", (ds, measure, y, m)):
                stat_fail.add(oid)
sum_check("EPPO-T05-02-02", "generation")
sum_check("EPPO-T05-02-02M", "generation")
sum_check("EPPO-T05-01-01", "installed_capacity")

# ---- 3) load factor สอดคล้อง
for ds in ("EPPO-T05-02-05", "EPPO-T05-02-05M"):
    rows = c.execute("""SELECT year_ce, COALESCE(month,0),
        MAX(CASE WHEN measure='peak_demand' THEN value END), MAX(CASE WHEN measure='generation' THEN value END),
        MAX(CASE WHEN measure='load_factor' THEN value END) FROM stat_observation WHERE dataset_ref=? GROUP BY 1,2""", (ds,)).fetchall()
    for y, m, p, g, lf in rows:
        if None in (p, g, lf):
            report.append(["stat_observation", f"{ds} {y}-{m:02d}", "load factor", "n/a", "ต้นฉบับเว้นว่าง (blank)"]); continue
        hrs = (366 if calendar.isleap(y) else 365) * 24 if m == 0 else calendar.monthrange(y, m)[1] * 24
        diff = lf - g * 1000 / (p * hrs) * 100
        ok = abs(diff) <= 1
        report.append(["stat_observation", f"{ds} {y}-{m:02d}", "load factor", "pass" if ok else "FAIL", f"diff={diff:.3f} pp"])
        if not ok:
            for (oid,) in c.execute("SELECT obs_id FROM stat_observation WHERE dataset_ref=? AND year_ce=? AND COALESCE(month,0)=?", (ds, y, m)):
                stat_fail.add(oid)

# ---- 4) ไม่ซ้ำ + ตามรอยได้
dup = c.execute("""SELECT COUNT(*) FROM (SELECT dataset_ref,measure,category,frequency,year_ce,month FROM stat_observation
                   GROUP BY 1,2,3,4,5,6 HAVING COUNT(*)>1)""").fetchone()[0]
untraced = c.execute("SELECT COUNT(*) FROM stat_observation WHERE location_in_source='' OR snapshot_sha256=''").fetchone()[0]
report.append(["stat_observation", "ทั้งตาราง", "unique key", "pass" if dup == 0 else "FAIL", f"ซ้ำ {dup} กลุ่ม"])
report.append(["stat_observation", "ทั้งตาราง", "traceable", "pass" if untraced == 0 else "FAIL", f"ขาดหลักฐาน {untraced} แถว"])

# ---- เปลี่ยนสถานะ (trigger บันทึก status_history ของ lci_exchange)
c.execute("INSERT OR REPLACE INTO session_ctx VALUES ('user','QA Lead · qa_review.py'), ('reason','M4 QA: ค่าตรงต้นฉบับและตามรอยได้')")
c.executemany("UPDATE lci_exchange SET review_status='reviewed' WHERE exchange_id=?", [(e,) for e in lci_ok])
if dup == 0 and untraced == 0:
    c.execute(f"""UPDATE stat_observation SET review_status='reviewed'
                  WHERE value_flag='value' AND review_status='unreviewed'
                  AND obs_id NOT IN ({','.join(map(str, stat_fail)) or '-1'})""")
c.execute("DELETE FROM session_ctx")
c.commit()

with open("qa_report.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["table", "item", "check", "result", "note"]); w.writerows(report)

for t in ("lci_exchange", "stat_observation"):
    print(t, c.execute(f"SELECT review_status, COUNT(*) FROM {t} GROUP BY 1").fetchall())
print("history rows:", c.execute("SELECT COUNT(*) FROM status_history").fetchone()[0],
      "| FAIL checks:", sum(r[3] == "FAIL" for r in report))
