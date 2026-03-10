#!/bin/sh
set -eu

SOURCE_JSON="$(cd "$(dirname "$0")/../.." && pwd)/data/sci-fi-library-mock-data.json"
DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/data/generated"
DEST_JSON="$DEST_DIR/sci-fi-library-mock-data.json"

if [ ! -f "$SOURCE_JSON" ]; then
  echo "Shared data file not found: $SOURCE_JSON" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SOURCE_JSON" "$DEST_JSON"

echo "Synced shared data to $DEST_JSON"
