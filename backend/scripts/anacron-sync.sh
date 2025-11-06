#!/bin/bash
# Script anacron pour garantir l'exécution de la synchronisation
# même après un crash ou un redémarrage du Raspberry Pi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$BACKEND_DIR/sync.log"
TIMESTAMP_FILE="$BACKEND_DIR/.last-sync-timestamp"

# Vérifier la dernière exécution
CURRENT_TIME=$(date +%s)
LAST_SYNC=0

if [ -f "$TIMESTAMP_FILE" ]; then
    LAST_SYNC=$(cat "$TIMESTAMP_FILE")
fi

# Calculer le temps écoulé (en heures)
TIME_DIFF=$(( ($CURRENT_TIME - $LAST_SYNC) / 3600 ))

# Si plus de 24 heures se sont écoulées, lancer la synchronisation
if [ $TIME_DIFF -ge 24 ]; then
    echo "=======================================" >> "$LOG_FILE"
    echo "🔄 Anacron sync started at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "⏰ Last sync was $TIME_DIFF hours ago" >> "$LOG_FILE"
    
    cd "$BACKEND_DIR"
    
    # Exécuter le script de fetch
    node scripts/fetch-weeks.js >> "$LOG_FILE" 2>&1
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Anacron sync completed successfully at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
        # Sauvegarder le timestamp de la dernière synchronisation réussie
        echo "$CURRENT_TIME" > "$TIMESTAMP_FILE"
    else
        echo "❌ Anacron sync failed with exit code $EXIT_CODE at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    fi
    
    echo "" >> "$LOG_FILE"
else
    echo "⏭️  Skipping sync - last sync was only $TIME_DIFF hours ago (< 24h)" >> "$LOG_FILE"
fi
