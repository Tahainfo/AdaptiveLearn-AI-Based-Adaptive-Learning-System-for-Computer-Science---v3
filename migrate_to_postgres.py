"""
Migration script: SQLite -> PostgreSQL (Neon)
Run this script ONCE from your local machine.
Usage: python migrate_to_postgres.py
"""

import sqlite3
import psycopg2
import os
import json

# ── Configuration ────────────────────────────────────────────
SQLITE_PATH = "data/adaptive_learning.db"

# Paste your Neon connection string here
NEON_URL = os.getenv("DATABASE_URL", "YOUR_NEON_CONNECTION_STRING_HERE")
if NEON_URL.startswith("postgres://"):
    NEON_URL = NEON_URL.replace("postgres://", "postgresql://", 1)

# Tables to migrate IN ORDER (respects foreign keys)
TABLES = [
    "students",
    "modules",
    "sequences",
    "concepts",
    "mastery_state",
    "exercises",
    "exercise_attempts",
    "mistakes_log",
    "diagnostic_attempts",
    "diagnostic_question_results",
    "admin_logs",
    "exercise_templates",
    "admin_settings",
]

# ── Helpers ──────────────────────────────────────────────────
def sqlite_connect():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def pg_connect():
    return psycopg2.connect(NEON_URL)

def get_columns(sqlite_cursor, table):
    sqlite_cursor.execute(f"PRAGMA table_info({table})")
    return [row[1] for row in sqlite_cursor.fetchall()]

def migrate_table(sqlite_cur, pg_cur, table):
    # Get column names from SQLite
    columns = get_columns(sqlite_cur, table)
    if not columns:
        print(f"  ⚠️  Table '{table}' not found in SQLite — skipping")
        return 0

    # Fetch all rows from SQLite
    sqlite_cur.execute(f"SELECT * FROM {table}")
    rows = sqlite_cur.fetchall()

    if not rows:
        print(f"  ○  {table}: empty — skipping")
        return 0

    # Build INSERT statement
    cols = ", ".join(columns)
    placeholders = ", ".join(["%s"] * len(columns))
    insert_sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

    # Convert rows to list of tuples
    data = [tuple(row) for row in rows]

    pg_cur.executemany(insert_sql, data)
    print(f"  ✅  {table}: {len(data)} rows migrated")
    return len(data)

def reset_sequences(pg_cur):
    """Reset PostgreSQL SERIAL sequences to match migrated data"""
    tables_with_serial = [
        "students", "modules", "sequences", "concepts",
        "mastery_state", "exercises", "exercise_attempts",
        "mistakes_log", "diagnostic_attempts", "diagnostic_question_results",
        "admin_logs", "exercise_templates", "admin_settings"
    ]
    for table in tables_with_serial:
        pg_cur.execute(f"""
            SELECT setval(
                pg_get_serial_sequence('{table}', 'id'),
                COALESCE((SELECT MAX(id) FROM {table}), 1)
            )
        """)
    print("  ✅  Serial sequences reset")

# ── Main ─────────────────────────────────────────────────────
def main():
    print("=" * 50)
    print("SQLite → PostgreSQL (Neon) Migration")
    print("=" * 50)

    if "YOUR_NEON_CONNECTION_STRING_HERE" in NEON_URL:
        print("\n❌ ERROR: Please set your Neon DATABASE_URL")
        print("   Either set the environment variable:")
        print("   $env:DATABASE_URL='postgresql://...'")
        print("   Or edit NEON_URL in this script directly.")
        return

    # Connect to both databases
    print("\n📡 Connecting to SQLite...")
    sqlite_conn = sqlite_connect()
    sqlite_cur = sqlite_conn.cursor()
    print("✅ SQLite connected")

    print("📡 Connecting to Neon PostgreSQL...")
    pg_conn = pg_connect()
    pg_cur = pg_conn.cursor()
    print("✅ Neon connected\n")

    # Migrate each table
    print("📦 Migrating tables...")
    total_rows = 0
    for table in TABLES:
        try:
            count = migrate_table(sqlite_cur, pg_cur, table)
            total_rows += count
        except Exception as e:
            print(f"  ❌  {table}: ERROR — {e}")
            pg_conn.rollback()

    # Reset sequences so new inserts don't conflict
    print("\n🔄 Resetting sequences...")
    reset_sequences(pg_cur)

    # Commit
    pg_conn.commit()

    # Close connections
    sqlite_conn.close()
    pg_conn.close()

    print(f"\n{'=' * 50}")
    print(f"✅ Migration complete — {total_rows} total rows migrated")
    print(f"{'=' * 50}")

if __name__ == "__main__":
    main()