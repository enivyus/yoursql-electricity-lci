"""Ch.6.x · สร้าง embedding ให้ Flow/Process แล้วเขียนกลับ Neo4j · ยังไม่ได้ทดลอง: ทีมรันและบันทึกผลจริง
pip install neo4j sentence-transformers
"""
from neo4j import GraphDatabase
from sentence_transformers import SentenceTransformer
URI, AUTH = "bolt://localhost:7687", ("neo4j", "<รหัสผ่านของทีม>")
MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"   # 384 มิติ รองรับไทย/อังกฤษ
model = SentenceTransformer(MODEL)
with GraphDatabase.driver(URI, auth=AUTH) as drv:
    for label, key, text in [("Flow", "flow_id", "f.name + ' (' + f.flow_type + ', ' + coalesce(f.compartment,'') + ')'"),
                             ("Process", "process_id", "f.description")]:
        recs = drv.execute_query(f"MATCH (f:{label}) RETURN f.{key} AS id, {text} AS txt").records
        vecs = model.encode([r["txt"] for r in recs], normalize_embeddings=True)
        for r, v in zip(recs, vecs):
            drv.execute_query(f"MATCH (f:{label} {{{key}: $id}}) SET f.embedding = $v, f.embed_text = $t",
                              id=r["id"], v=v.tolist(), t=r["txt"])
        print(label, len(recs), "nodes embedded, dims =", len(vecs[0]))
    for label in ("Flow", "Process"):
        drv.execute_query(f"""CREATE VECTOR INDEX {label.lower()}_embedding IF NOT EXISTS
            FOR (n:{label}) ON n.embedding
            OPTIONS {{indexConfig: {{`vector.dimensions`: 384, `vector.similarity_function`: 'cosine'}}}}""")
    # ตัวอย่างคำถาม Q1–Q3 (บันทึกผลจริงลงตารางบทที่ 6.x)
    questions = {
        "Q1": "การปล่อยก๊าซเรือนกระจกสู่อากาศ",
        "Q2": "สารเคมีบำบัดน้ำหล่อเย็น",
        "Q3": "ของเสียจากโรงไฟฟ้า และมาจากแหล่งข้อมูลไหน",
    }
    for q, text in questions.items():
        qv = model.encode(text, normalize_embeddings=True).tolist()
        recs = drv.execute_query("""
            CALL db.index.vector.queryNodes('flow_embedding', 5, $qv) YIELD node AS f, score
            MATCH (p:Process)-[e:EXCHANGES]->(f), (p)-[:CITED_FROM]->(s:Source)
            RETURN f.name AS flow, e.direction AS dir, e.amount_original AS amount, e.unit AS unit,
                   e.review_status AS status, s.source_id AS source, round(score, 3) AS score
            ORDER BY score DESC""", qv=qv).records
        print(f"\n{q}: {text}")
        for r in recs: print(dict(r))
