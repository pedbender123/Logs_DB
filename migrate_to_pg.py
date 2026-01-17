import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, System, Log, Report, LogFilter
from dotenv import load_dotenv

load_dotenv()

# Source
SQLITE_PATH = "logs.db"
# Destination (Adjust if running outside Docker for the first migration)
# Defaulting to localhost if running manually before Docker up or via external access
PG_URL = os.getenv("DATABASE_URL", "postgresql://pbpm_user:pbpm_pass@localhost:5432/logs_db")

def migrate():
    if not os.path.exists(SQLITE_PATH):
        print(f"SQLite file '{SQLITE_PATH}' not found. Nothing to migrate.")
        return

    print(f"Connecting to Source (SQLite): {SQLITE_PATH}")
    sqlite_engine = create_engine(f"sqlite:///{SQLITE_PATH}")
    
    print(f"Connecting to Destination (Postgres): {PG_URL}")
    pg_engine = create_engine(PG_URL)

    # Ensure tables exist in PG
    print("Creating tables in Postgres...")
    Base.metadata.create_all(pg_engine)

    # Sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PgSession = sessionmaker(bind=pg_engine)

    s_sqlite = SqliteSession()
    s_pg = PgSession()

    try:
        # Migrate Systems
        print("Migrating Systems...")
        systems = s_sqlite.query(System).all()
        for sys in systems:
            # Clear relationship state to avoid issues during merge
            s_sqlite.expunge(sys)
            s_pg.merge(sys)
        s_pg.commit()
        print(f"✓ Migrated {len(systems)} systems.")

        # Migrate Log Filters
        print("Migrating Filters...")
        filters = s_sqlite.query(LogFilter).all()
        for f in filters:
            s_sqlite.expunge(f)
            s_pg.merge(f)
        s_pg.commit()
        print(f"✓ Migrated {len(filters)} filters.")

        # Migrate Logs
        print("Migrating Logs (this may take a while)...")
        logs = s_sqlite.query(Log).all()
        for l in logs:
            s_sqlite.expunge(l)
            s_pg.merge(l)
        s_pg.commit()
        print(f"✓ Migrated {len(logs)} logs.")

        # Migrate Reports
        print("Migrating Reports...")
        reports = s_sqlite.query(Report).all()
        for r in reports:
            s_sqlite.expunge(r)
            s_pg.merge(r)
        s_pg.commit()
        print(f"✓ Migrated {len(reports)} reports.")

        print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ ERROR DURING MIGRATION: {e}")
        s_pg.rollback()
    finally:
        s_sqlite.close()
        s_pg.close()

if __name__ == "__main__":
    migrate()
    print("\nNext step: Run 'docker compose up -d' for production.")
