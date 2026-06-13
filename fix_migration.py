"""
Fix migration - migrate each table with individual commits
Run: python fix_migration.py
"""
import sqlite3
import psycopg2
import os

SQLITE_PATH = "data/adaptive_learning.db"
url = os.getenv("DATABASE_URL")

TABLES = [
    "students",
    "modules",
    "sequences",
    "concepts",
    "mastery_state",
    "exercises",
    "diagnostic_attempts",
    "diagnostic_question_results",
    "admin_settings",
]

sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

pg_conn = psycopg2.connect(url)
pg_cur = pg_conn.cursor()

for table in TABLES:
    try:
        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = [tuple(r) for r in sqlite_cur.fetchall()]
        
        if not rows:
            print(f"  ○  {table}: empty — skipping")
            continue

        cols = [d[0] for d in sqlite_cur.description]
        cols_str = ", ".join(cols)
        placeholders = ", ".join(["%s"] * len(cols))
        
        inserted = 0
        for row in rows:
            try:
                pg_cur.execute(
                    f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING",
                    row
                )
                inserted += 1
            except Exception as e:
                pg_conn.rollback()

        pg_conn.commit()

        # Reset sequence
        try:
            pg_cur.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 1)
                )
            """)
            pg_conn.commit()
        except Exception:
            pg_conn.rollback()

        print(f"  ✅  {table}: {inserted} rows migrated")

    except Exception as e:
        print(f"  ❌  {table}: {e}")
        pg_conn.rollback()

# Verify
print("\n--- Verification ---")
for table in TABLES:
    try:
        pg_cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = pg_cur.fetchone()[0]
        print(f"  {table}: {count} rows")
    except Exception as e:
        print(f"  {table}: ERROR {e}")

sqlite_conn.close()
pg_conn.close()
print("\n✅ Done")