#!/bin/bash
set -e

# Aller dans le dossier des scripts BetterEDT
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/BetterEDT/backend/scripts

# Lancer la sync futur (15 semaines) côté BD
/usr/bin/node fetch-weeks-db.js >> ../logs/edt-sync-future.log 2>&1
