"""Validate a whole CSV batch before creating a NEW SQLite database.
Usage: python sql/02_load.py data new.db [--snapshots snapshots]
status_history.csv is an archival export, not an import input.
"""
import argparse
import csv
import hashlib
import math
from pathlib import Path
import re
import sqlite3
import sys

ORDER = ('source', 'location', 'unit', 'flow', 'process', 'lci_exchange', 'stat_observation')
UNITS = {
    'MMBTU': ('energy', 'MJ', 1055.05585262), 'm3': ('volume', 'm3', 1),
    'liter': ('volume', 'm3', .001), 'kg': ('mass', 'kg', 1),
    'tons': ('mass', 'kg', 1000), 'mg/l': ('concentration', 'mg/l', 1),
    'MWh': ('energy', 'MJ', 3600), 'ton-steam': ('mass', 'kg', 1000),
    'GWh': ('energy', 'MJ', 3600000), 'MW': ('power', 'MW', 1), '%': ('ratio', '%', 1),
}
ALIASES = {'GWH': 'GWh', 'tons-steam': 'ton-steam',
           'kgSO2': 'kg', 'kgNOx': 'kg', 'kgCO2': 'kg', 'kgPM': 'kg'}
MEASURE_UNITS = {'generation': 'GWh', 'installed_capacity': 'MW',
                 'peak_demand': 'MW', 'load_factor': '%'}


class ImportRejected(ValueError):
    pass


def snapshot_hash(root, name, cache):
    path = (root / name).resolve()
    if not name or path == root or root not in path.parents:
        raise ValueError('snapshot path must stay inside snapshot directory')
    if path not in cache:
        cache[path] = hashlib.sha256(path.read_bytes()).hexdigest()
    return cache[path]


def validate_row(con, table, row, snapshots, hashes):
    if table == 'unit':
        expected = UNITS.get(row['symbol'])
        if expected != (row['quantity'], row['base_symbol'], row['to_base_factor']):
            raise ValueError('units: unsupported symbol, dimension or conversion factor')
    if table not in ('lci_exchange', 'stat_observation'):
        return
    if not re.fullmatch(r'[0-9a-fA-F]{64}', row['snapshot_sha256']):
        raise ValueError('hash: expected a SHA-256 hex digest')
    if snapshot_hash(snapshots, row['snapshot_file'], hashes) != row['snapshot_sha256'].lower():
        raise ValueError('hash: snapshot SHA-256 mismatch')
    unit = con.execute('SELECT symbol FROM unit WHERE unit_id=?', (row['unit_id'],)).fetchone()
    if not unit or ALIASES.get(row['unit_original'], row['unit_original']) != unit[0]:
        raise ValueError('units: original unit does not match unit_id')
    if table == 'stat_observation' and MEASURE_UNITS.get(row['measure']) != unit[0]:
        raise ValueError('units: incompatible statistical measure')


def stage_import(data, snapshots):
    """Return a validated in-memory DB and counts; never persist partial input."""
    con = sqlite3.connect(':memory:')
    con.executescript(Path(__file__).with_name('01_schema.sql').read_text(encoding='utf-8'))
    errors, counts, hashes = [], [], {}
    try:
        for table in ORDER:
            schema = list(con.execute(f'PRAGMA table_info({table})'))
            columns = [c[1] for c in schema]
            count = 0
            try:
                with (data / f'{table}.csv').open(encoding='utf-8-sig', newline='') as stream:
                    reader = csv.reader(stream, strict=True)
                    if next(reader, None) != columns:
                        raise ValueError(f'CSV header must be exactly {columns}')
                    for line, values in enumerate(reader, 2):
                        try:
                            if len(values) != len(columns):
                                raise ValueError('schema: wrong CSV field count')
                            row = {}
                            for (_, name, kind, required, _, pk), value in zip(schema, values):
                                if table == 'stat_observation' and name == 'value_original' and values[columns.index('value_flag')] == 'blank':
                                    pass  # Preserve the source's blank verbatim (BR-03).
                                elif not value.strip():
                                    if required or pk:
                                        raise ValueError(f'schema: {name} cannot be empty')
                                    value = None
                                elif kind == 'INTEGER':
                                    if not re.fullmatch(r'[+-]?[0-9]+', value):
                                        raise ValueError(f'schema: {name} must be an integer')
                                    value = int(value)
                                elif kind == 'REAL':
                                    value = float(value)
                                    if not math.isfinite(value):
                                        raise ValueError(f'schema: {name} must be finite')
                                row[name] = value
                            validate_row(con, table, row, snapshots, hashes)
                            con.execute(f'INSERT INTO {table} ({",".join(columns)}) VALUES ({",".join("?" for _ in columns)})', list(row.values()))
                            count += 1
                        except (ValueError, OSError, sqlite3.Error, OverflowError) as exc:
                            errors.append(f'{table}.csv:{line}: {exc}')
                counts.append((table, count))
            except (ValueError, OSError, csv.Error) as exc:
                errors.append(f'{table}.csv: {exc}')
        if errors:
            raise ImportRejected('\n'.join(errors))
        if con.execute('PRAGMA foreign_key_check').fetchall():
            raise ImportRejected('schema: foreign key check failed')
        con.commit()
        return con, counts
    except BaseException:
        con.close()
        raise


def import_database(data, output, snapshots):
    output = Path(output)
    if output.exists():
        raise ImportRejected(f'output already exists: {output}')
    con, counts = stage_import(Path(data), Path(snapshots).resolve())
    created = False
    try:
        # Exclusive creation prevents a race from overwriting an existing DB.
        with output.open('xb'):
            created = True
        dest = sqlite3.connect(output)
        try:
            con.backup(dest)
        finally:
            dest.close()
    except BaseException:
        if created:
            output.unlink(missing_ok=True)
        raise
    finally:
        con.close()
    return counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--snapshots', type=Path)
    args = parser.parse_args()
    try:
        counts = import_database(args.data, args.output, args.snapshots or args.data.parent / 'snapshots')
    except (ImportRejected, OSError, sqlite3.Error) as exc:
        print(f'REJECT batch (no output published): {exc}', file=sys.stderr)
        return 1
    print('table          loaded rejected')
    for table, count in counts:
        print(f'{table:16}{count:5}        0')
    return 0


if __name__ == '__main__':
    sys.exit(main())
