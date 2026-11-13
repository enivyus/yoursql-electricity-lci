"""Run a .sql file against SQLite and print each result (stand-in for the sqlite3 CLI). Usage: python run_sql.py db file.sql"""
import sqlite3, sys
con = sqlite3.connect(sys.argv[1], isolation_level=None); con.execute('PRAGMA foreign_keys=ON')
buf, comment = '', []
for line in open(sys.argv[2], encoding='utf-8'):
    s = line.strip()
    if s.startswith('.'): continue
    if not buf.strip() and not s: continue
    if s.startswith('--') and not buf.strip(): comment.append(s); buf=''; continue
    buf += line
    if sqlite3.complete_statement(buf):
        for c in comment: print(c)
        comment = []
        try:
            cur = con.execute(buf)
            rows = cur.fetchall()
            if cur.description:
                print(' | '.join(d[0] for d in cur.description))
                for r in rows: print(' | '.join('' if v is None else str(v) for v in r))
        except sqlite3.Error as e:
            print('ERROR:', e)
        print(); buf = ''
