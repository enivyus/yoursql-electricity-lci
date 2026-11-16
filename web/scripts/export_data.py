"""Export db/lci.db -> web/src/data/*.json for the demo website.

Run from the repository root:  python web/scripts/export_data.py
Reads only; never modifies the database.
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db" / "lci.db"
OUT = ROOT / "web" / "src" / "data"


def rows(con, sql):
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

    data = {
        "sources": rows(con, "SELECT * FROM source ORDER BY source_id"),
        "process": rows(con, """
            SELECT p.*, l.name AS location_name, l.country
            FROM process p JOIN location l USING (location_id)"""),
        "exchanges": rows(con, """
            SELECT e.exchange_id, e.process_id, f.name AS flow, f.flow_type, f.compartment,
                   e.direction, e.amount_original, e.amount, e.unit_original,
                   u.quantity, e.is_reference, e.allocation_stage, e.cited_document, e.remark,
                   e.location_in_source, e.snapshot_file, e.snapshot_sha256, e.retrieved_on,
                   e.review_status, e.source_id
            FROM lci_exchange e JOIN flow f USING (flow_id) JOIN unit u USING (unit_id)
            ORDER BY e.exchange_id"""),
        "observations": rows(con, """
            SELECT obs_id, source_id, dataset_ref, measure, category, category_kind, frequency,
                   year_label, year_ce, month, year_type, is_preliminary, capacity_type,
                   generation_basis, value_original, value, value_flag, unit_original,
                   location_in_source, snapshot_file, snapshot_sha256, retrieved_on, review_status
            FROM stat_observation ORDER BY obs_id"""),
        "history": rows(con, "SELECT * FROM status_history ORDER BY history_id"),
        "schema": {
            "tables": con.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0],
            "triggers": con.execute("SELECT count(*) FROM sqlite_master WHERE type='trigger'").fetchone()[0],
            "indexes": con.execute("SELECT count(*) FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").fetchone()[0],
            "foreign_keys": sum(
                len(con.execute(f"PRAGMA foreign_key_list({t})").fetchall())
                for (t,) in con.execute("SELECT name FROM sqlite_master WHERE type='table'")),
        },
    }
    for name, value in data.items():
        (OUT / f"{name}.json").write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        print(f"{name}.json", len(value) if isinstance(value, list) else value)


if __name__ == "__main__":
    main()
