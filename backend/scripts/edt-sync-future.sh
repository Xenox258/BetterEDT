#!/bin/bash
set -e

cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/BetterEDT/backend/scripts

LOG="/srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/BetterEDT/backend/logs/edt-sync-future.log"
exec >>"$LOG" 2>&1

/usr/bin/node fetch-weeks-db.js
