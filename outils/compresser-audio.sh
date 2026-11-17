#!/bin/sh
# Compresse un audio pour l'application Vainqueur : MP3 mono 48 kbit/s (1 h ≈ 22 Mo).
# Si le résultat dépasse 25 Mo (limite de Cloudflare Pages), il est coupé en parties de 50 min.
# Usage : sh compresser-audio.sh enregistrement.m4a nom-du-fichier
set -e
ENTREE="$1"; NOM="${2:-audio}"
[ -f "$ENTREE" ] || { echo "Usage : sh compresser-audio.sh fichier-source nom-de-sortie"; exit 1; }
ffmpeg -hide_banner -loglevel error -y -i "$ENTREE" -ac 1 -ar 44100 -b:a 48k -af "loudnorm=I=-16:TP=-1.5:LRA=11" "$NOM.mp3"
TAILLE=$(wc -c < "$NOM.mp3")
if [ "$TAILLE" -gt 25000000 ]; then
  ffmpeg -hide_banner -loglevel error -y -i "$NOM.mp3" -f segment -segment_time 3000 -c copy "$NOM-partie%d.mp3"
  rm "$NOM.mp3"; echo "Fichier trop gros : coupé en parties →"; ls -la "$NOM"-partie*.mp3
else
  echo "Prêt : $NOM.mp3 ($((TAILLE / 1024)) Ko)"
fi
