"""Run with python -m unittest discover -s tests -v. All DBs/fixtures are temporary."""
import csv
from contextlib import closing
import hashlib
import importlib.util
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('loader', ROOT / 'sql/02_load.py')
loader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loader)


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.reader(f))


def write_csv(path, rows):
    with path.open('w', encoding='utf-8', newline='') as f:
        csv.writer(f).writerows(rows)


def fixture(directory):
    """Copy the repository CSVs; tests never touch the originals."""
    data = directory / 'data'
    shutil.copytree(ROOT / 'data', data)
    return data


class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.data = fixture(self.path)
        self.db = self.path / 'test.db'

    def load(self):
        return loader.import_database(self.data, self.db, ROOT / 'snapshots')

    def connect(self):
        self.load()
        con = sqlite3.connect(self.db)
        con.execute('PRAGMA foreign_keys=ON')
        self.addCleanup(con.close)
        return con

    def change(self, table, column, value):
        path = self.data / f'{table}.csv'
        rows = read_csv(path)
        rows[1][rows[0].index(column)] = value
        write_csv(path, rows)

    def rejected(self, pattern):
        with self.assertRaisesRegex(loader.ImportRejected, pattern):
            self.load()
        self.assertFalse(self.db.exists())

    def test_valid_import(self):
        self.assertEqual(dict(self.load()), dict(source=10, location=1, unit=11, flow=29,
                                                process=1, lci_exchange=31, stat_observation=857))

    def test_real_data_imports_and_missing_snapshot_rejected(self):
        self.assertEqual(dict(loader.import_database(ROOT / 'data', self.path / 'real.db', ROOT / 'snapshots'))['lci_exchange'], 31)
        self.change('lci_exchange', 'snapshot_file', 'SNAP-SRC08-20261109_matecconf_iscee2017_05009.pdf')
        self.rejected('SNAP-SRC08-20261109')

    def test_existing_database_untouched(self):
        self.db.write_bytes(b'do not overwrite')
        with self.assertRaisesRegex(loader.ImportRejected, 'already exists'):
            self.load()
        self.assertEqual(self.db.read_bytes(), b'do not overwrite')

    def test_headers(self):
        path = self.data / 'source.csv'
        original = read_csv(path)
        for header in [original[0][:-1], original[0] + ['extra'],
                       [original[0][0]] * len(original[0]), list(reversed(original[0]))]:
            with self.subTest(header=header):
                write_csv(path, [header] + original[1:])
                self.rejected('CSV header')

    def test_row_width(self):
        path = self.data / 'source.csv'
        rows = read_csv(path)
        rows[1].append('extra')
        write_csv(path, rows)
        self.rejected('field count')

    def test_invalid_values(self):
        cases = [('stat_observation', 'value', 'garbage', 'convert'),
                 ('stat_observation', 'value', 'NaN', 'finite'),
                 ('lci_exchange', 'amount', 'inf', 'finite'),
                 ('stat_observation', 'year_ce', '2025.5', 'integer'),
                 ('lci_exchange', 'process_id', '999', 'FOREIGN KEY'),
                 ('stat_observation', 'review_status', 'invalid', 'CHECK'),
                 ('stat_observation', 'source_id', ' ', 'empty'),
                 ('stat_observation', 'month', '13', 'CHECK'),
                 ('lci_exchange', 'amount', '-1', 'CHECK')]
        for table, col, value, message in cases:
            with self.subTest(table=table, col=col, value=value):
                path = self.data / f'{table}.csv'
                original = path.read_bytes()
                self.change(table, col, value)
                self.rejected(message)
                path.write_bytes(original)

    def test_units(self):
        for table, col, value in [('unit', 'to_base_factor', '2'),
                                   ('unit', 'quantity', 'power'),
                                   ('stat_observation', 'unit_original', 'mW'),
                                   ('stat_observation', 'measure', 'peak_demand'),
                                   ('lci_exchange', 'unit_id', '9')]:
            with self.subTest(table=table, col=col):
                path = self.data / f'{table}.csv'
                original = path.read_bytes()
                self.change(table, col, value)
                self.rejected('units:')
                path.write_bytes(original)

    def test_hash_and_paths(self):
        for col, value, message in [('snapshot_sha256', 'abc', 'SHA-256'),
                                   ('snapshot_sha256', '0' * 64, 'mismatch'),
                                   ('snapshot_file', '../README.md', 'inside'),
                                   ('snapshot_file', 'missing.pdf', 'missing.pdf')]:
            with self.subTest(col=col, value=value):
                path = self.data / 'lci_exchange.csv'
                original = path.read_bytes()
                self.change('lci_exchange', col, value)
                self.rejected(message)
                path.write_bytes(original)

    def test_modified_snapshot_bytes(self):
        snaps = self.path / 'snapshots'
        shutil.copytree(ROOT / 'snapshots', snaps)
        name = read_csv(self.data / 'stat_observation.csv')[1][21]
        with (snaps / name).open('ab') as stream:
            stream.write(b'tampered')
        with self.assertRaisesRegex(loader.ImportRejected, 'mismatch'):
            loader.import_database(self.data, self.db, snaps)
        self.assertFalse(self.db.exists())

    def test_all_original_columns_immutable(self):
        con = self.connect()
        for table, pk in [('lci_exchange', 'exchange_id'), ('stat_observation', 'obs_id')]:
            for _, column, kind, *_ in con.execute(f'PRAGMA table_info({table})').fetchall():
                if column == 'review_status':
                    continue
                with self.subTest(table=table, column=column):
                    with self.assertRaisesRegex(sqlite3.IntegrityError, 'BR-05'):
                        con.execute(f'UPDATE {table} SET {column}=? WHERE {pk}=1',
                                    ('changed' if kind == 'TEXT' else 99999,))
            # A no-op update of source data does not corrupt data.
            con.execute(f'UPDATE {table} SET {pk}={pk}')

    def test_delete_replace_upsert_blocked(self):
        con = self.connect()
        for recursive in (0, 1):
            con.execute(f'PRAGMA recursive_triggers={recursive}')
            for table, pk in [('lci_exchange', 'exchange_id'), ('stat_observation', 'obs_id')]:
                for sql in [f'DELETE FROM {table} WHERE {pk}=1',
                            f'INSERT OR REPLACE INTO {table} SELECT * FROM {table} WHERE {pk}=1',
                            f'INSERT INTO {table} SELECT * FROM {table} WHERE {pk}=1 ON CONFLICT({pk}) DO UPDATE SET review_status=excluded.review_status']:
                    with self.subTest(sql=sql, recursive=recursive):
                        with self.assertRaisesRegex(sqlite3.IntegrityError, 'BR-05'):
                            con.execute(sql)

    def test_audit_context_and_complete_events(self):
        con = self.connect()
        targets = [('lci_exchange', 'exchange_id', 1, 'review_status', 'conflict'),
                   ('stat_observation', 'obs_id', 1, 'review_status', 'conflict'),
                   ('source', 'source_id', 'SRC-01', 'license_status', 'confirmed')]
        for table, pk, key, field, status in targets:
            sql = f'UPDATE {table} SET {field}=? WHERE {pk}=?'
            before = con.execute(f'SELECT * FROM {table} WHERE {pk}=?', (key,)).fetchone()
            for user, reason in [(None, None), ('alice', ''), (' ', 'reason')]:
                con.execute('DELETE FROM session_ctx')
                con.executemany('INSERT INTO session_ctx VALUES (?,?)', [('user', user), ('reason', reason)])
                with self.assertRaisesRegex(sqlite3.IntegrityError, 'FR-09'):
                    con.execute(sql, (status, key))
            con.execute('DELETE FROM session_ctx')
            con.executemany('INSERT INTO session_ctx VALUES (?,?)', [('user', 'alice'), ('reason', 'verified')])
            con.execute(sql, (status, key))
            con.execute(sql, (status, key))  # no-op produces no extra log
            event = con.execute(f'SELECT old_status,new_status,changed_by,reason,changed_at,status_field FROM status_history WHERE {pk}=?', (key,)).fetchall()
            self.assertEqual(len(event), 1)
            self.assertEqual(event[0][1:4], (status, 'alice', 'verified'))
            self.assertRegex(event[0][4], r'^\d{4}-\d{2}-\d{2} ')
            self.assertEqual(event[0][5], field)
            columns = [x[1] for x in con.execute(f'PRAGMA table_info({table})')]
            after = con.execute(f'SELECT * FROM {table} WHERE {pk}=?', (key,)).fetchone()
            idx = columns.index(field)
            self.assertEqual(before[:idx] + before[idx+1:], after[:idx] + after[idx+1:])
            self.assertEqual(event[0][0], before[idx])
        con.rollback()
        self.assertEqual(con.execute('SELECT count(*) FROM status_history').fetchone()[0], 0)

    def test_audit_history_tampering(self):
        con = self.connect()
        con.executescript("INSERT INTO session_ctx VALUES ('user','alice'),('reason','check'); UPDATE stat_observation SET review_status='conflict' WHERE obs_id=1;")
        for sql in ['UPDATE status_history SET reason="forged"', 'DELETE FROM status_history',
                    'INSERT OR REPLACE INTO status_history SELECT * FROM status_history',
                    "INSERT OR REPLACE INTO source SELECT * FROM source WHERE source_id='SRC-01'",
                    "DELETE FROM source WHERE source_id='SRC-01'",
                    "UPDATE source SET source_id='SRC-99' WHERE source_id='SRC-01'"]:
            with self.subTest(sql=sql):
                with self.assertRaisesRegex(sqlite3.IntegrityError, 'FR-09'):
                    con.execute(sql)

    def run_script(self, *args):
        result = subprocess.run([sys.executable, *map(str, args)], cwd=self.path,
                                capture_output=True, text=True, encoding='utf-8',
                                env={**__import__('os').environ, 'PYTHONIOENCODING': 'utf-8'})
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result.stdout

    def test_full_qa_and_q01_q27(self):
        self.load()
        qa = self.run_script(ROOT / 'scripts/qa_review.py', self.db)
        self.assertIn('FAIL checks: 0', qa)
        output = self.run_script(ROOT / 'sql/run_sql.py', self.db, ROOT / 'sql/03_queries.sql')
        self.assertEqual(set(re.findall(r'-- (Q\d\d)', output)), {f'Q{i:02}' for i in range(1, 28)})
        self.assertNotIn('ERROR:', output)
        with closing(sqlite3.connect(self.db)) as con:
            self.assertEqual(con.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertEqual(con.execute('PRAGMA foreign_key_check').fetchall(), [])
            self.assertEqual(con.execute("SELECT count(*) FROM lci_exchange WHERE review_status='reviewed'").fetchone()[0], 26)
            self.assertEqual(con.execute("SELECT count(*) FROM stat_observation WHERE review_status='reviewed'").fetchone()[0], 844)
            self.assertEqual(con.execute('SELECT count(*) FROM status_history').fetchone()[0], 870)  # QA events kept; Q12 rolled back

    def test_qa_audits_870_transitions(self):
        for table in ('lci_exchange', 'stat_observation'):
            path = self.data / f'{table}.csv'
            rows = read_csv(path)
            idx = rows[0].index('review_status')
            for row in rows[1:]:
                if row[idx] == 'reviewed':
                    row[idx] = 'unreviewed'
            write_csv(path, rows)
        self.load()
        self.assertIn('FAIL checks: 0', self.run_script(ROOT / 'scripts/qa_review.py', self.db))
        self.assertIn('FAIL checks: 0', self.run_script(ROOT / 'scripts/qa_review.py', self.db))
        with closing(sqlite3.connect(self.db)) as con:
            self.assertEqual(con.execute('SELECT count(exchange_id),count(obs_id) FROM status_history').fetchone(), (26, 844))
            self.assertEqual(con.execute('SELECT count(*) FROM session_ctx').fetchone()[0], 0)

    def test_sql_errors_have_nonzero_exit(self):
        self.load()
        sql = self.path / 'bad.sql'
        sql.write_text('SELECT * FROM missing;\n', encoding='utf-8')
        result = subprocess.run([sys.executable, str(ROOT / 'sql/run_sql.py'), str(self.db), str(sql)], capture_output=True)
        self.assertEqual(result.returncode, 1)


if __name__ == '__main__':
    unittest.main()
