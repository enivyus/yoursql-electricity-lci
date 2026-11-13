"""Extraction/Load pipeline: CSV -> SQLite (Ch.5.1). Usage: python 02_load.py data_dir out.db"""
import csv, sqlite3, sys, pathlib
data, db = pathlib.Path(sys.argv[1]), sys.argv[2]
con = sqlite3.connect(db); con.execute('PRAGMA foreign_keys=ON')
con.executescript(pathlib.Path(__file__).with_name('01_schema.sql').read_text(encoding='utf-8'))
order = ['source','location','unit','flow','process','lci_exchange','stat_observation']
report = []
for t in order:
    with open(data/f'{t}.csv', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    ok = bad = 0
    for r in rows:
        r = {k: (None if v == '' and k in ('amount','cited_document','remark','license_note','month','capacity_type','generation_basis','value') else v) for k, v in r.items()}
        cols = ','.join(r); qs = ','.join('?'*len(r))
        try:
            con.execute(f'INSERT INTO {t} ({cols}) VALUES ({qs})', list(r.values())); ok += 1
        except sqlite3.Error as e:
            bad += 1; print(f'REJECT {t}: {e} :: {r}')
    report.append((t, len(rows), ok, bad))
con.commit()
print(f"{'table':14}{'csv_rows':>9}{'loaded':>8}{'rejected':>9}")
for t,n,o,b in report: print(f'{t:14}{n:>9}{o:>8}{b:>9}')
