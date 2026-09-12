#!/usr/bin/env bash
set -euo pipefail

command -v hermes >/dev/null || {
  echo "Hermes is not installed." >&2
  exit 1
}
command -v openssl >/dev/null || {
  echo "OpenSSL is required to generate the local bearer." >&2
  exit 1
}

project_env="${1:-.env.local}"
hermes_env="$(hermes config env-path)"
gateway_key="$(openssl rand -hex 32)"

set_env() {
  local file="$1" name="$2" value="$3" dir tmp
  dir="$(dirname "$file")"
  mkdir -p "$dir"
  touch "$file"
  tmp="$(mktemp "$dir/.rally-env.XXXXXX")"
  awk -F= -v name="$name" '$1 != name { print }' "$file" > "$tmp"
  printf '%s=%s\n' "$name" "$value" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$file"
}

set_env "$hermes_env" API_SERVER_ENABLED true
set_env "$hermes_env" API_SERVER_HOST 127.0.0.1
set_env "$hermes_env" API_SERVER_PORT 8642
set_env "$hermes_env" API_SERVER_MODEL_NAME hermes-agent
set_env "$hermes_env" API_SERVER_KEY "$gateway_key"

set_env "$project_env" HERMES_MODE live
set_env "$project_env" HERMES_ENDPOINT http://127.0.0.1:8642/v1
set_env "$project_env" HERMES_API_KEY "$gateway_key"

unset gateway_key
hermes gateway restart
echo "Configured the OAuth-backed Hermes gateway for Rally at http://127.0.0.1:8642/v1."
