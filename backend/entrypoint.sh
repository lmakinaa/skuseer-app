#!/bin/sh
set -e

# Run migrations to current head. Idempotent: no-op if already up to date.
echo "[entrypoint] Running alembic migrations..."
alembic upgrade head

# Seed only on a fresh database (no users yet). seed.py calls clear_tables(),
# so running it unconditionally would wipe real data on every restart.
echo "[entrypoint] Checking if seed is needed..."
NEEDS_SEED=$(python -c "
import os, sys
from sqlalchemy import create_engine, inspect, text
url = os.getenv('DATABASE_URL', 'sqlite:///./stockseer.db')
engine = create_engine(url)
insp = inspect(engine)
if 'users' not in insp.get_table_names():
    print('yes'); sys.exit(0)
with engine.connect() as c:
    count = c.execute(text('SELECT COUNT(*) FROM users')).scalar()
print('yes' if count == 0 else 'no')
")

if [ "$NEEDS_SEED" = "yes" ]; then
    echo "[entrypoint] Empty database detected — seeding..."
    python seed.py
else
    echo "[entrypoint] Database already has data — skipping seed."
fi

echo "[entrypoint] Starting: $@"
exec "$@"
