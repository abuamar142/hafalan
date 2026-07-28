#!/bin/bash
# Quran Tracker — Database Migration Runner
# Usage: ./supabase/migrate.sh
#
# Runs all unapplied migrations from supabase/migrations/ in order.
# Tracks applied migrations in a schema_migrations table.

set -euo pipefail

# Load .env from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

DATABASE_URL="${DATABASE_URL:?DATABASE_URL not set in .env}"

echo "📦 Running migrations against Supabase..."
echo ""

# Create tracking table if not exists
psql "$DATABASE_URL" -q -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now()
);"

# Get list of already applied versions
APPLIED=$(psql "$DATABASE_URL" -t -A -c "SELECT version FROM schema_migrations ORDER BY version;")

# Find and run pending migrations
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
PENDING=0

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$file" ] || continue
  VERSION=$(basename "$file" .sql)

  if echo "$APPLIED" | grep -qxF "$VERSION"; then
    continue
  fi

  echo "▶ Applying: $VERSION"
  psql "$DATABASE_URL" -q -f "$file"
  psql "$DATABASE_URL" -q -c "INSERT INTO schema_migrations (version) VALUES ('$VERSION');"
  echo "✓ Applied: $VERSION"
  echo ""
  PENDING=$((PENDING + 1))
done

if [ "$PENDING" -eq 0 ]; then
  echo "✅ All migrations already applied."
else
  echo "✅ Applied $PENDING migration(s)."
fi
