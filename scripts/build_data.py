import csv
SHA='9a6303c62d8b50a06e7b956a57d9a9ac253b67e4425bf08dbf7497c14a24f223'
SNAP='SNAP-SRC08-20261109_matecconf_iscee2017_05009.pdf'
RET='2026-11-09'
def w(name, header, rows):
    with open(f'data/{name}.csv','w',newline='',encoding='utf-8') as f:
        cw=csv.writer(f); cw.writerow(header); cw.writerows(rows)

src=[
 ('SRC-01','Electricity Statistic ตาราง 5.1-1, 5.2-1, 5.2-2, 5.2-5','EPPO','1986–2025; 2026 รายเดือน','https://www.eppo.go.th/energy-statistics/electricity-statistic/','EPPO-T05-01-01;EPPO-T05-02-01;EPPO-T05-02-02;EPPO-T05-02-05','egat_system','unconfirmed','หน่วยงานรัฐ ยังไม่ตรวจเงื่อนไขการใช้ซ้ำ'),
 ('SRC-02','Electricity Statistic ตาราง 5.3-4, 5.4-1, 5.5-1, 5.5-2','EPPO','1986–2025','https://www.eppo.go.th/energy-statistics/electricity-statistic/','EPPO-T05-03-04;EPPO-T05-04-01;EPPO-T05-05-01;EPPO-T05-05-02','country','unconfirmed',''),
 ('SRC-03','CO2 Statistic ตาราง 9.1-3, 9.1-15','EPPO','1986–2025','https://www.eppo.go.th/energy-statistics/co2-statistic/','EPPO-T09-01-03;EPPO-T09-01-15','country','unconfirmed',''),
 ('SRC-04','System Installed / Contracted Generating Capacity','EGAT','snapshot 2026-01','https://www.egat.co.th/home/en/statistics-all-latest/','EGAT-STAT-INSTALLED;EGAT-STAT-CONTRACTED-202601','egat_system','unconfirmed',''),
 ('SRC-05','Sustainability — Energy Management','EGAT','2022–2024','https://www.egat.co.th/sustainability/en/environment/energy/','EGAT-SUS-ENERGY-2024','organization','unconfirmed','สิทธิเผยแพร่ซ้ำยังไม่ยืนยัน'),
 ('SRC-06','Statistical Yearbook Thailand 2026 ตาราง 13.1–13.3','NSO','2026','https://www.nso.go.th/public/e-book/Statistical-Yearbook/SYB-2026_webPage/File_SYB/2026/Full/Statistical_Yearbook_Thailand_2026.pdf','NSO-SYB2026-13.1;NSO-SYB2026-13.2;NSO-SYB2026-13.3','country','unconfirmed',''),
 ('SRC-07','Emission Factor from Electricity Generation/Consumption for GHG Mitigation Projects and Activities','TGO','2025 (ปีข้อมูล 2018–2022)','https://tver.tgo.or.th/database/Uploads/Document/f4d7230b-05b4-4a03-adcf-b4123fb3a224.pdf','TGO-EF-20250528','reference_value','unconfirmed',''),
 ('SRC-08','Usapein, P.; Chavalparit, O. Life Cycle Assessment of Producing Electricity in Thailand: A Case Study of Natural Gas Power Plant. MATEC Web of Conferences 103, 05009','MATEC Web of Conferences (EDP Sciences)','2017','https://doi.org/10.1051/matecconf/201710305009','MATEC-103-05009-T1;MATEC-103-05009-T2','plant','confirmed','CC BY 4.0'),
 ('SRC-09','Thailand PV Status Report 2023 หัวข้อ 1.1','DEDE','2023','https://pvstatus.dede.go.th/en/section_1-1.php','DEDE-PVSTATUS-2023-S1.1','country','unconfirmed',''),
 ('SRC-10','Thailand country data','Ember','2026-04-22','https://ember-energy.org/countries-and-regions/thailand/','EMBER-TH-202604','country','unconfirmed','ต้องตรวจเงื่อนไขสิทธิการใช้งาน'),
]
w('source',['source_id','title','publisher','year','url','source_ref','reporting_level','license_status','license_note'],src)
w('location',['location_id','name','country'],[(1,'Thailand (โรงไฟฟ้ากรณีศึกษา ไม่ระบุจังหวัด)','TH')])
units=[(1,'MMBTU','energy','MJ',1055.05585262),(2,'m3','volume','m3',1),(3,'liter','volume','m3',0.001),
       (4,'kg','mass','kg',1),(5,'tons','mass','kg',1000),(6,'mg/l','concentration','mg/l',1),(7,'MWh','energy','MJ',3600),(8,'ton-steam','mass','kg',1000),(9,'GWh','energy','MJ',3600000),(10,'MW','power','MW',1),(11,'%','ratio','%',1)]
w('unit',['unit_id','symbol','quantity','base_symbol','to_base_factor'],units)
flows=[
 (1,'Natural gas','technosphere','resource',1),(2,'Water','elementary','resource',2),(3,'Diesel','technosphere','technosphere',3),
 (4,'SF6','technosphere','technosphere',4),(5,'H2SO4','technosphere','technosphere',5),(6,'NaOH','technosphere','technosphere',5),
 (7,'NaOCl','technosphere','technosphere',5),(8,'Cooling water corrosion inhibitor','technosphere','technosphere',5),
 (9,'Oxygen scavenger','technosphere','technosphere',5),(10,'Na3PO4','technosphere','technosphere',5),
 (11,'Feed water corrosion inhibitor','technosphere','technosphere',5),(12,'Cooling water dispersent','technosphere','technosphere',5),
 (13,'Cooling water biocide','technosphere','technosphere',5),(14,'Scale inhibitor','technosphere','technosphere',5),
 (15,'Sodium bisulfate','technosphere','technosphere',5),(16,'Closed cooling water circuit corrosion inhibitor','technosphere','technosphere',5),
 (17,'SO2','elementary','air',4),(18,'NOx','elementary','air',4),(19,'CO2','elementary','air',4),(20,'Particulate Matter','elementary','air',4),
 (21,'BOD','elementary','water',6),(22,'COD','elementary','water',6),(23,'Suspended solid','elementary','water',6),(24,'Dissolved solid','elementary','water',6),
 (25,'Municipal waste','waste','technosphere',4),(26,'Non-hazardous waste','waste','technosphere',4),(27,'Hazardous waste','waste','technosphere',4),
 (28,'Electricity','product','technosphere',7),(29,'Steam','product','technosphere',8),
]
w('flow',['flow_id','name','flow_type','compartment','default_unit_id'],flows)
w('process',['process_id','name','domain','reporting_level','reference_basis','functional_unit','system_boundary','allocation_method','data_period','year_type','publication_year','location_id','source_id'],
 [(1,'Electricity and steam production, natural gas CHP (case study), Thailand','Electricity & Power Generation','plant',
   'การเดินเครื่อง 1 ปี (ปริมาณรวมรายปีตาม Table 1)','ไฟฟ้า 1 kWh และไอน้ำ 1 ตัน','cradle-to-gate',
   'efficiency method (WRI/WBCSD) ประสิทธิภาพไฟฟ้า 53% ไอน้ำ 80%','ไม่ระบุ','ไม่ระบุ',2017,1,'SRC-08')])
EIA='EIA report (2555)'; AS='at site'
T1='Table 1 (p.5) แถว '
# (flow_id, dir, amount_original, unit_id, unit_original, cited, remark, status)
ex=[
 (1,'IN','5,615,021',1,'MMBTU',AS,'',None),
 (2,'IN','1,098,153',2,'m3',AS,'',None),
 (3,'IN','1,200',3,'liter',None,'Diesel for system backup generator',None),
 (3,'IN','400',3,'liter',None,'Diesel for fire pump',None),
 (3,'IN','125',3,'liter',None,'Diesel for forklift',None),
 (4,'IN','1.00E-04',4,'kg',AS,'',None),
 (5,'IN','240',5,'tons',EIA,'',None),(6,'IN','144',5,'tons',EIA,'',None),(7,'IN','35',5,'tons',EIA,'',None),
 (8,'IN','5',5,'tons',EIA,'',None),(9,'IN','1.5',5,'tons',EIA,'',None),(10,'IN','5',5,'tons',EIA,'',None),
 (11,'IN','1',5,'tons',EIA,'',None),(12,'IN','6',5,'tons',EIA,'',None),(13,'IN','1.5',5,'tons',EIA,'',None),
 (14,'IN','1.5',5,'tons',EIA,'',None),(15,'IN','6',5,'tons',EIA,'',None),(16,'IN','1',5,'tons',EIA,'',None),
 (17,'OUT','21,030',4,'kgSO2',EIA,'',None),
 (18,'OUT','15,1361',4,'kgNOx',EIA,'รูปแบบตัวเลขผิดปกติ (คอมมาไม่ตรงหลักพัน) อ่านเป็นตัวเลขไม่ได้','held'),
 (19,'OUT','324,686,938',4,'kgCO2',EIA,'',None),
 (20,'OUT','40,460',4,'kgPM',EIA,'',None),
 (21,'OUT','6.09',6,'mg/l',AS,'รายงานเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี','held'),
 (22,'OUT','52',6,'mg/l',AS,'รายงานเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี','held'),
 (23,'OUT','25',6,'mg/l',AS,'รายงานเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี','held'),
 (24,'OUT','1,646',6,'mg/l',AS,'รายงานเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี','held'),
 (25,'OUT','7,850',4,'kg',AS,'',None),(26,'OUT','1,650',4,'kg',AS,'',None),(27,'OUT','480',4,'kg',AS,'',None),
]
rows=[]
for i,(f,d,ao,u,uo,cited,rem,st) in enumerate(ex,1):
    if st=='held' and f==18: amt=''
    else: amt=repr(float(ao.replace(',','')))
    rows.append((i,1,f,d,ao,amt,u,uo,0,'before',cited or '',rem,T1+str(i),SNAP,SHA,RET,'held_context' if st else 'unreviewed','SRC-08'))
# reference products (text p.7, not Table 1)
rows.append((30,1,28,'OUT','727,696','727696.0',7,'MWh',1,'before','','ผลผลิตไฟฟ้ารวม (Reference Flow)','ข้อความหัวข้อ 3.2 (p.7)',SNAP,SHA,RET,'unreviewed','SRC-08'))
rows.append((31,1,29,'OUT','259,200','259200.0',8,'tons-steam',0,'before','','ผลผลิตร่วม ไอน้ำ','ข้อความหัวข้อ 3.2 (p.7)',SNAP,SHA,RET,'unreviewed','SRC-08'))
w('lci_exchange',['exchange_id','process_id','flow_id','direction','amount_original','amount','unit_id','unit_original','is_reference','allocation_stage','cited_document','remark','location_in_source','snapshot_file','snapshot_sha256','retrieved_on','review_status','source_id'],rows)
print(len(rows))
