#!/bin/bash
# Script de synchronisation automatique pour cron
# Synchronise les données flopedt vers les JSON locaux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$BACKEND_DIR/logs/sync.log"

# Ajouter un timestamp au log
echo "=======================================" >> "$LOG_FILE"
echo "🔄 Sync started at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

cd "$BACKEND_DIR"

# Exécuter le script de fetch
node scripts/fetch-weeks.js >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Sync completed successfully at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
else
    echo "❌ Sync failed with exit code $EXIT_CODE at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
