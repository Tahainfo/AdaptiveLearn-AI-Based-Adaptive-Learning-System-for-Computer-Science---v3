"""
Database configuration and initialization
Migrated from SQLite to PostgreSQL
"""
import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

# Database URL from environment variable
# Local fallback uses SQLite-style URL — on Render, set DATABASE_URL to your Neon connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://localhost/adaptive_learning"
)

# Neon and some providers use postgres:// — SQLAlchemy and psycopg2 need postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def get_db_connection():
    """Get a PostgreSQL database connection"""
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database with schema"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Students table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
            is_active INTEGER NOT NULL DEFAULT 1,
            classe TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Modules table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS modules (
            id SERIAL PRIMARY KEY,
            title TEXT UNIQUE NOT NULL,
            description TEXT,
            order_index INTEGER
        )
    """)

    # Sequences table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sequences (
            id SERIAL PRIMARY KEY,
            module_id INTEGER NOT NULL REFERENCES modules(id),
            title TEXT NOT NULL,
            description TEXT,
            order_index INTEGER,
            UNIQUE(module_id, title)
        )
    """)

    # Concepts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS concepts (
            id SERIAL PRIMARY KEY,
            sequence_id INTEGER REFERENCES sequences(id),
            name TEXT NOT NULL,
            domain TEXT NOT NULL,
            description TEXT,
            hours INTEGER DEFAULT 0,
            UNIQUE(sequence_id, name)
        )
    """)

    # Mastery state
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mastery_state (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id),
            concept_id INTEGER NOT NULL REFERENCES concepts(id),
            mastery_level REAL DEFAULT 0.0,
            attempts_count INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, concept_id)
        )
    """)

    # Exercises table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exercises (
            id SERIAL PRIMARY KEY,
            concept_id INTEGER NOT NULL REFERENCES concepts(id),
            title TEXT NOT NULL,
            description TEXT,
            difficulty TEXT,
            exercise_prompt TEXT,
            solution TEXT,
            explanation TEXT,
            exercise_type TEXT DEFAULT 'short_answer'
                CHECK(exercise_type IN ('mcq','drag_drop','match_lines','short_answer','long_answer','true_false')),
            is_diagnostic INTEGER DEFAULT 0,
            error_type_targeted TEXT
                CHECK(error_type_targeted IN ('conceptual','procedural','careless') OR error_type_targeted IS NULL),
            content_json TEXT,
            created_by_admin_id INTEGER REFERENCES students(id),
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Exercise attempts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exercise_attempts (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id),
            exercise_id INTEGER NOT NULL REFERENCES exercises(id),
            student_answer TEXT,
            is_correct INTEGER,
            error_type TEXT,
            time_spent_seconds INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Mistakes log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mistakes_log (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id),
            concept_id INTEGER NOT NULL REFERENCES concepts(id),
            mistake_type TEXT,
            description TEXT,
            context TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Diagnostic attempts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnostic_attempts (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id),
            concept_id INTEGER NOT NULL REFERENCES concepts(id),
            score REAL,
            answers TEXT,
            error_types_detected TEXT,
            classification TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Diagnostic question results
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnostic_question_results (
            id SERIAL PRIMARY KEY,
            attempt_id INTEGER NOT NULL REFERENCES diagnostic_attempts(id),
            exercise_id INTEGER NOT NULL REFERENCES exercises(id),
            is_correct INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dqr_attempt  ON diagnostic_question_results(attempt_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dqr_exercise ON diagnostic_question_results(exercise_id)")

    # Admin logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL REFERENCES students(id),
            action_type TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id INTEGER,
            target_user_id INTEGER REFERENCES students(id),
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Exercise templates
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exercise_templates (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            exercise_type TEXT NOT NULL,
            content_json TEXT NOT NULL,
            description TEXT,
            created_by_admin_id INTEGER NOT NULL REFERENCES students(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Admin settings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_settings (
            id SERIAL PRIMARY KEY,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            description TEXT,
            updated_by_admin_id INTEGER REFERENCES students(id),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
            ('enable_ai_generation',      'true',  'Allow AI-generated exercises'),
            ('prioritize_admin_exercises','true',  'Use admin exercises before AI-generated'),
            ('max_diagnostic_questions',  '10',    'Maximum questions per diagnostic test'),
            ('mastery_threshold',         '0.7',   'Mastery level threshold (0-1)'),
            ('weak_concept_threshold',    '0.4',   'Weakness threshold (0-1)')
        ON CONFLICT (setting_key) DO NOTHING
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_role     ON students(role)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_exercises_type    ON exercises(exercise_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_exercises_active  ON exercises(is_active)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_admin_logs_admin  ON admin_logs(admin_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_admin_logs_ts     ON admin_logs(timestamp)")

    conn.commit()
    conn.close()
    print("✅ PostgreSQL database initialized")


def insert_default_modules_and_sequences():
    """Insert default modules, sequences and concepts"""
    conn = get_db_connection()
    cursor = conn.cursor()

    modules_data = [
        {
            "title": "Généralités sur les systèmes informatiques",
            "description": "Tronc commun - Fondamentaux des systèmes informatiques",
            "sequences": [
                {
                    "title": "Définitions et vocabulaire de base",
                    "concepts": [
                        ("Définition de l'information", 2),
                        ("Définition du traitement", 2),
                        ("Définition de l'informatique", 2),
                        ("Définition du système informatique", 2),
                    ]
                },
                {
                    "title": "Structure de base d'un ordinateur",
                    "concepts": [
                        ("Schéma fonctionnel d'un ordinateur", 2),
                        ("Périphériques", 2),
                        ("Unité centrale de traitement", 2),
                    ]
                },
                {
                    "title": "Les types de logiciels",
                    "concepts": [
                        ("Les logiciels de base", 2),
                        ("Les logiciels d'application", 2),
                    ]
                },
                {
                    "title": "Domaines d'application",
                    "concepts": [
                        ("Applications de l'informatique", 2),
                    ]
                },
            ]
        },
        {
            "title": "Les logiciels",
            "description": "Tronc commun - Utilisation des logiciels",
            "sequences": [
                {
                    "title": "Système d'exploitation",
                    "concepts": [
                        ("Fonctionnalités de base d'un système d'exploitation", 2),
                        ("Environnement d'un système d'exploitation", 2),
                        ("Gestion des fichiers/dossiers", 2),
                    ]
                },
                {
                    "title": "Traitement de texte",
                    "concepts": [
                        ("Fonctionnalités d'un texteur", 3),
                        ("L'environnement de travail", 3),
                        ("Saisie et mise en forme", 3),
                        ("Insertion d'objets et mise en page", 3),
                    ]
                },
                {
                    "title": "Tableur",
                    "concepts": [
                        ("Fonctionnalités d'un tableur", 2),
                        ("L'environnement de travail", 2),
                        ("Formules et Adressage", 2),
                        ("Fonctions et Graphiques", 2),
                    ]
                },
            ]
        },
        {
            "title": "Algorithmique et programmation",
            "description": "Tronc commun - Concepts de base de la programmation",
            "sequences": [
                {
                    "title": "Notion d'algorithme",
                    "concepts": [
                        ("Constante", 2),
                        ("Variable", 2),
                        ("Type", 2),
                    ]
                },
                {
                    "title": "Instructions de base",
                    "concepts": [
                        ("Lecture", 2),
                        ("Ecriture", 2),
                        ("Affectation", 2),
                    ]
                },
                {
                    "title": "Structures de contrôle de base",
                    "concepts": [
                        ("Séquentielle", 2),
                        ("Sélective", 2),
                    ]
                },
                {
                    "title": "Langages de programmation",
                    "concepts": [
                        ("Notion de programme", 1),
                        ("Langages de programmation", 1),
                        ("Transcription d'algorithme", 1),
                    ]
                },
            ]
        },
        {
            "title": "Réseaux et Internet",
            "description": "Tronc commun - Fondamentaux des réseaux",
            "sequences": [
                {
                    "title": "Notion de réseau informatique",
                    "concepts": [
                        ("Notion de réseau informatique", 1),
                        ("Topologie de réseaux", 1),
                        ("Avantages d'un réseau", 2),
                    ]
                },
                {
                    "title": "Réseau Internet",
                    "concepts": [
                        ("Définition d'Internet", 2),
                        ("Connexion à Internet", 2),
                        ("Services Internet (Web, e-mail, chat)", 2),
                        ("Avantages et inconvénients", 2),
                    ]
                },
            ]
        },
    ]

    for module_idx, module in enumerate(modules_data):
        try:
            cursor.execute(
                "INSERT INTO modules (title, description, order_index) VALUES (%s, %s, %s) ON CONFLICT (title) DO NOTHING RETURNING id",
                (module["title"], module["description"], module_idx + 1)
            )
            row = cursor.fetchone()
            if not row:
                cursor.execute("SELECT id FROM modules WHERE title = %s", (module["title"],))
                row = cursor.fetchone()
            module_id = row[0]

            for seq_idx, sequence in enumerate(module["sequences"]):
                cursor.execute(
                    "INSERT INTO sequences (module_id, title, order_index) VALUES (%s, %s, %s) ON CONFLICT (module_id, title) DO NOTHING RETURNING id",
                    (module_id, sequence["title"], seq_idx + 1)
                )
                row = cursor.fetchone()
                if not row:
                    cursor.execute("SELECT id FROM sequences WHERE module_id = %s AND title = %s", (module_id, sequence["title"]))
                    row = cursor.fetchone()
                sequence_id = row[0]

                for concept_name, hours in sequence["concepts"]:
                    cursor.execute(
                        "INSERT INTO concepts (sequence_id, name, domain, hours) VALUES (%s, %s, %s, %s) ON CONFLICT (sequence_id, name) DO NOTHING",
                        (sequence_id, concept_name, module["title"], hours)
                    )
        except Exception as e:
            print(f"Warning during seed: {e}")
            conn.rollback()
            conn = get_db_connection()
            cursor = conn.cursor()

    conn.commit()
    conn.close()
    print("✅ Default modules and sequences inserted")


def insert_default_concepts():
    """Kept for backward compatibility"""
    insert_default_modules_and_sequences()


if __name__ == "__main__":
    init_db()
    insert_default_concepts()