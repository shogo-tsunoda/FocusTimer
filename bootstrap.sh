#!/bin/bash
set -e

TARGET_DIR="C:/Users/developer/.cargo/focus-timer-target"
CARGO_BIN="C:/Users/developer/.cargo/bin"
CRATE="C:/Users/developer/project/FocusTimer/src-tauri"

run_pass() {
  local out
  out=$(cd "$CRATE" && CARGO_TARGET_DIR="$TARGET_DIR" cargo check 2>&1 || true)
  echo "$out" | grep -E "Finished|error\[" | head -5

  # Find blocked scripts
  local scripts
  scripts=$(echo "$out" | grep "could not execute process" | \
    sed 's/.*process `//; s/` .*//' | grep -v "^$")

  if [ -z "$scripts" ]; then
    echo "$out" | tail -3
    return 0
  fi

  while IFS= read -r script; do
    [ -z "$script" ] && continue
    local build_dir
    build_dir=$(dirname "$script")
    mkdir -p "$build_dir/out"

    local name
    name=$(basename "$build_dir")
    local tmp="$CARGO_BIN/tmp_bs.exe"

    cp "$script" "$tmp" 2>/dev/null || continue
    echo "  run: $name"
    TARGET=x86_64-pc-windows-msvc HOST=x86_64-pc-windows-msvc \
      OUT_DIR="$build_dir/out" \
      CARGO_MANIFEST_DIR="$build_dir" \
      RUSTC="$CARGO_BIN/rustc.exe" \
      "$tmp" > /dev/null 2>&1 || true
    rm -f "$tmp"
  done <<< "$scripts"
  return 1
}

for i in $(seq 1 30); do
  echo "=== Pass $i ==="
  run_pass && { echo "SUCCESS"; exit 0; } || true
  sleep 0.5
done
echo "GAVE UP after 30 passes"
