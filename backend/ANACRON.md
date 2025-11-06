# Configuration Anacron pour EDT-IUT

Ce guide vous permet de configurer **anacron** pour garantir que la synchronisation des données s'exécute même après un crash ou un redémarrage de votre Raspberry Pi.

## Qu'est-ce qu'Anacron ?

Anacron est un planificateur de tâches qui, contrairement à cron, s'assure que les tâches sont exécutées même si le système était éteint au moment prévu. Il est idéal pour les systèmes qui ne sont pas toujours allumés (comme un Raspberry Pi).

## Installation

Anacron est normalement déjà installé sur Raspberry Pi OS. Vérifiez avec :

```bash
which anacron
```

Si anacron n'est pas installé :

```bash
sudo apt-get update
sudo apt-get install anacron
```

## Configuration

### 1. Ajouter la tâche à anacrontab

Ouvrez le fichier de configuration anacron :

```bash
sudo nano /etc/anacrontab
```

Ajoutez cette ligne à la fin du fichier :

```
1       10      edt-iut-sync    /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/scripts/anacron-sync.sh
```

Explication des paramètres :
- **1** : La tâche s'exécute tous les jours (périodicité en jours)
- **10** : Délai de 10 minutes après le démarrage avant d'exécuter la tâche
- **edt-iut-sync** : Identifiant unique de la tâche
- **Chemin** : Script à exécuter

Sauvegardez avec `Ctrl+O`, puis quittez avec `Ctrl+X`.

### 2. Tester la configuration

Pour tester manuellement anacron (en mode debug) :

```bash
sudo anacron -d -f
```

Pour forcer l'exécution de toutes les tâches anacron :

```bash
sudo anacron -f
```

Pour voir les tâches anacron planifiées :

```bash
sudo anacron -T
```

### 3. Vérifier les logs

Les logs de synchronisation sont dans :

```bash
tail -f /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log
```

Les timestamps de dernière exécution sont stockés dans `/var/spool/anacron/` :

```bash
cat /var/spool/anacron/edt-iut-sync
```

## Comment ça fonctionne ?

1. **Au démarrage du Raspberry Pi**, anacron démarre automatiquement (via systemd)
2. Il vérifie les tâches qui auraient dû s'exécuter pendant l'arrêt
3. Si la dernière synchronisation date de plus de 24h, il lance `anacron-sync.sh`
4. Le script vérifie lui-même le timestamp pour éviter les doublons avec cron
5. La synchronisation s'exécute et met à jour le timestamp

## Combinaison avec Cron

Vous pouvez garder votre tâche cron existante pour les synchronisations régulières :

```bash
crontab -e
```

Exemple : synchronisation toutes les 6 heures :

```
0 */6 * * * /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/scripts/sync-cron.sh
```

**Anacron** servira de filet de sécurité pour s'assurer qu'au moins une synchronisation par jour est effectuée, même après un redémarrage.

## Désactiver Anacron (si nécessaire)

Pour désactiver temporairement la tâche, commentez la ligne dans `/etc/anacrontab` :

```bash
sudo nano /etc/anacrontab
```

Ajoutez un `#` devant la ligne :

```
# 1       10      edt-iut-sync    /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/scripts/anacron-sync.sh
```

## Dépannage

### La tâche ne s'exécute pas

1. Vérifiez qu'anacron est actif :
   ```bash
   systemctl status anacron
   ```

2. Vérifiez les permissions du script :
   ```bash
   ls -l /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/scripts/anacron-sync.sh
   ```
   Le script doit être exécutable (`-rwxr-xr-x`).

3. Vérifiez la syntaxe d'anacrontab :
   ```bash
   sudo anacron -T
   ```

### Forcer une exécution immédiate

Pour tester sans attendre :

```bash
sudo /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/scripts/anacron-sync.sh
```

Ou supprimer le timestamp pour simuler une synchronisation manquée :

```bash
sudo rm /var/spool/anacron/edt-iut-sync
sudo anacron -f
```

## Résumé

- ✅ **Cron** : Synchronisation régulière toutes les X heures (si le système est allumé)
- ✅ **Anacron** : Synchronisation de rattrapage après un redémarrage ou un crash
- ✅ **Protection contre les doublons** : Le script vérifie le timestamp avant de s'exécuter
- ✅ **Logs centralisés** : Tout est enregistré dans `backend/sync.log`
