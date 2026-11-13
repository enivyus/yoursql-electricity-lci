"""ถอดตาราง EPPO (SRC-01) เป็น data/stat_observation.csv · usage: python build_stats.py raw_dir"""
import xlrd, csv, hashlib, sys, pathlib, re
raw = pathlib.Path(sys.argv[1]); RET = '2026-11-09'
MON = {m:i for i,m in enumerate(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],1)}
rows = []; excluded = []
def KEY(f): return re.sub(r'^(SNAP-SRC01-\d+_|[0-9a-f]{8}-)', '', f.name)
def sha(f): return hashlib.sha256(f.read_bytes()).hexdigest()
def fmt(v):
    return repr(float(v)) if isinstance(v, float) else str(v)
def add(f, ds, measure, cat, kind, freq, ylabel, yce, month, prelim, cap, basis, cell, unit_id, unit_o, r, c):
    v = cell.value
    blank = (str(v).strip() == '')
    rows.append(dict(source_id='SRC-01', dataset_ref=ds, measure=measure, category=cat, category_kind=kind,
        reporting_level='egat_system', frequency=freq, year_label=ylabel, year_ce=yce, month=month or '',
        year_type='ไม่ระบุ', is_preliminary=prelim, capacity_type=cap or '', generation_basis=basis or '',
        value_original='' if blank else fmt(v), value='' if blank else fmt(float(v)), value_flag='blank' if blank else 'value',
        unit_id=unit_id, unit_original=unit_o, location_in_source=f'{KEY(f)}!{xlrd.colname(c)}{r+1}',
        snapshot_file='SNAP-SRC01-20261109_'+KEY(f), snapshot_sha256=sha(f), retrieved_on=RET, review_status='unreviewed'))
F = {re.sub(r"^(SNAP-SRC01-\d+_|[0-9a-f]{8}-)", "", p.name): p for p in raw.glob("*.xls")}
# 5.2-2Y yearly generation by fuel (GWh)
f = F['T05_02_02-2.xls']; sh = xlrd.open_workbook(f).sheet_by_index(0)
fuels = ['Hydro Electricity','Fuel Oil','Coal & Lignite','Natural Gas','Diesel','Imported','Renewable Energy','Total']
for r in range(6, sh.nrows):
    y = sh.cell_value(r,0)
    if not isinstance(y, float): break
    for c,name in enumerate(fuels,1):
        add(f,'EPPO-T05-02-02','generation',name,'system_total' if name=='Total' else 'fuel','yearly',str(int(y)),int(y),None,0,None,'ไม่ระบุ',sh.cell(r,c),9,'GWH',r,c)
excluded.append(('T05_02_02-2.xls','ส่วน Share (%) แถว 50–93','ค่าที่คำนวณจากค่าหลัก ไม่ใช่ข้อมูลต้นทาง', 40*8))
# 5.2-2 monthly 2024-2026
f = F['T05_02_02.xls']; sh = xlrd.open_workbook(f).sheet_by_index(0)
fuels_m = ['Hydro Electricity','Fuel Oil','Coal & Lignite','Natural Gas','Diesel','Imported','Renewable Energy','Total']
year = None; tot = 0
for r in range(5, sh.nrows):
    a = str(sh.cell_value(r,0)).strip(); m = str(sh.cell_value(r,1)).strip().upper()
    if a.startswith('Fuel Share'): break
    if re.fullmatch(r'\d{4}', a): year = int(a)
    if a == 'Total': tot += 1; continue
    if m in MON and year:
        for c,name in enumerate(fuels_m,2):
            add(f,'EPPO-T05-02-02M','generation',name,'system_total' if name=='Total' else 'fuel','monthly',str(year),year,MON[m],1 if year==2026 else 0,None,'ไม่ระบุ',sh.cell(r,c),9,'GWH',r,c)
excluded.append(('T05_02_02.xls',f'แถว Total ({tot} แถว) และส่วน Fuel Share (%)','ผลรวม/สัดส่วนที่คำนวณแล้ว · Total ของ 2026 เป็นผลรวม 8 เดือน ห้ามใช้เป็นยอดรายปี (BR-08)', tot*8))
# 5.1-1Y installed capacity by producer (MW)
f = F['T05_01_01-2.xls']; sh = xlrd.open_workbook(f).sheet_by_index(0)
for r in range(5, sh.nrows):
    y = sh.cell_value(r,0)
    if not isinstance(y, float): break
    for c,name in enumerate(['EGAT','IPP','SPP','Imported','Total'],1):
        add(f,'EPPO-T05-01-01','installed_capacity',name,'system_total' if name=='Total' else 'producer','yearly',str(int(y)),int(y),None,0,'installed',None,sh.cell(r,c),10,'MW',r,c)
excluded.append(('T05_01_01-2.xls','ส่วน Share (%)','ค่าที่คำนวณจากค่าหลัก', 25*5))
# 5.2-5Y peak / generation / load factor yearly
f = F['T05_02_05-2.xls']; sh = xlrd.open_workbook(f).sheet_by_index(0)
for r in range(5, sh.nrows):
    y = sh.cell_value(r,0)
    if not isinstance(y, float): break
    y = int(y); basis = 'gross' if y <= 2008 else ('net' if y <= 2017 else 'ไม่ระบุ')
    add(f,'EPPO-T05-02-05','peak_demand','Total','system_total','yearly',str(y),y,None,0,None,basis,sh.cell(r,1),10,'MW',r,1)
    add(f,'EPPO-T05-02-05','generation','Total','system_total','yearly',str(y),y,None,0,None,basis,sh.cell(r,2),9,'GWh',r,2)
    add(f,'EPPO-T05-02-05','load_factor','Total','system_total','yearly',str(y),y,None,0,None,basis,sh.cell(r,3),11,'%',r,3)
excluded.append(('T05_02_05-2.xls','คอลัมน์ GENERATION (KWh)','ซ้ำกับคอลัมน์ GWh (แปลงหน่วยตายตัว)', 40))
# 5.2-5 monthly 2026 (net)
f = F['T05_02_05.xls']; sh = xlrd.open_workbook(f).sheet_by_index(0)
for r in range(6, sh.nrows):
    m = str(sh.cell_value(r,0)).strip().upper()
    if m == 'TOTAL': break
    if m in MON:
        add(f,'EPPO-T05-02-05M','peak_demand','Total','system_total','monthly','2026',2026,MON[m],1,None,'net',sh.cell(r,1),10,'MW',r,1)
        add(f,'EPPO-T05-02-05M','generation','Total','system_total','monthly','2026',2026,MON[m],1,None,'net',sh.cell(r,2),9,'GWh',r,2)
        add(f,'EPPO-T05-02-05M','load_factor','Total','system_total','monthly','2026',2026,MON[m],1,None,'net',sh.cell(r,3),11,'%',r,3)
excluded.append(('T05_02_05.xls','แถว TOTAL ปี 2026','ผลรวม 8 เดือน ห้ามใช้เป็นยอดรายปี (BR-08)', 3))
excluded.append(('T05_02_01.xls, T05_02_01-2.xls, T05_01_01.ppt','ทั้งไฟล์','ข้อมูลซ้ำกับ 5.2-2 / 5.1-1 · ไฟล์ .ppt เป็นกราฟ (BR-03) · เก็บ snapshot ไว้สำหรับ BR-04', 0))
for i,r in enumerate(rows,1): r['obs_id']=i
cols=['obs_id']+[k for k in rows[0] if k!='obs_id']
with open('data/stat_observation.csv','w',newline='',encoding='utf-8') as fo:
    w=csv.DictWriter(fo,fieldnames=cols); w.writeheader(); w.writerows(rows)
with open('results/stats_excluded.csv','w',newline='',encoding='utf-8') as fo:
    w=csv.writer(fo); w.writerow(['file','part','reason','approx_cells']); w.writerows(excluded)
from collections import Counter
print(len(rows)); print(Counter((r['dataset_ref'],r['value_flag']) for r in rows))
