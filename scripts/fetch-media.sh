#!/usr/bin/env bash
# Manually download the exercise images (JPG) and animations (GIF) into ./media.
# You normally DON'T need this — `docker compose up` fetches them automatically.
# Two sources, two licenses:
#  - hasaneyldrm/exercises-dataset — MIT for the metadata and instruction text, but the
#    images and GIFs are © Gym visual (https://gymvisual.com/), used under that dataset's
#    terms. LiftBoi does not redistribute or relicense them. See NOTICE.md.
#  - yuhonas/free-exercise-db — Unlicense (public domain), images included. Backs the
#    fe#### exercise ids added on top of the base dataset (exercises-data-fed.js).
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cat <<'EOF'
↓ Downloading exercise media (~140 MB) from github.com/hasaneyldrm/exercises-dataset
  Metadata and instruction text: MIT.
  Images and animations: © Gym visual — https://gymvisual.com/
  Used under that dataset's terms, not LiftBoi's AGPL; LiftBoi does not redistribute them.
  Terms: https://gymvisual.com/content/3-terms-and-conditions-of-use
  Reusing this media yourself, commercially or not, needs your own licence from Gym visual.
  Details in NOTICE.md.
EOF
git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset "$tmp"
mkdir -p media/img media/gif
cp "$tmp"/images/*.jpg media/img/
cp "$tmp"/videos/*.gif media/gif/

echo "↓ Downloading additional exercise images (~50 MB) from github.com/yuhonas/free-exercise-db"
echo "  Unlicense (public domain) — see NOTICE.md."
fedtmp="$(mktemp -d)"
git clone --depth 1 https://github.com/yuhonas/free-exercise-db "$fedtmp"
while IFS="$(printf '\t')" read -r id src; do
  cp "$fedtmp/exercises/$src" "media/img/$id.jpg"
done < scripts/fed-image-manifest.tsv

echo "✓ $(ls media/img | wc -l) images, $(ls media/gif | wc -l) GIFs"
