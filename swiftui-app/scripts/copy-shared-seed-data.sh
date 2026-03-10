#!/bin/sh
set -eu

SOURCE_JSON="$SRCROOT/../data/sci-fi-library-mock-data.json"
DEST_DIR="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
DEST_JSON="$DEST_DIR/sci-fi-library-mock-data.json"

if [ ! -f "$SOURCE_JSON" ]; then
  echo "error: Shared seed data file missing at $SOURCE_JSON" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SOURCE_JSON" "$DEST_JSON"

echo "Copied shared seed data to bundle: $DEST_JSON"
