#!/usr/bin/env bash
# Builds iechm-backend. No `make` required (not always available) - this
# just compiles every .c file with zig's bundled clang and links them.
set -euo pipefail
cd "$(dirname "$0")"

export PATH="$HOME/.local/bin:$PATH"
CC="zig cc"
CFLAGS="-O2 -I. -Isrc -Wall -Wno-unused-parameter"
LDFLAGS="-lpthread -ldl -lm"

mkdir -p build
OBJS=()
for f in src/*.c vendor/sqlite3.c vendor/cJSON.c; do
  obj="build/$(basename "${f%.c}").o"
  echo "cc  $f"
  $CC $CFLAGS -c "$f" -o "$obj"
  OBJS+=("$obj")
done

echo "ld  iechm-backend"
$CC "${OBJS[@]}" $LDFLAGS -o iechm-backend
echo "done -> ./iechm-backend"
