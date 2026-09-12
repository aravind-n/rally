#!/usr/bin/env bash
set -euo pipefail

read -r -p "Ambiguous admin email: " email
read -r -s -p "Ambiguous password: " password
echo

login=$(jq -n --arg email "$email" --arg password "$password" \
  '{email: $email, password: $password}' |
  curl -fsS https://app.ambiguous.ai/api/auth/login \
    -H 'Content-Type: application/json' \
    --data-binary @-)
unset password

token=$(printf '%s' "$login" | jq -er '.token') || {
  echo "Login did not return a token. Select the workspace in Ambiguous and try again." >&2
  exit 1
}

curl -fsS -X POST https://app.ambiguous.ai/api/admin/users/provision-agent \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -d '{"display_name":"Rally"}' |
  jq

echo "Save the api_key value now; Ambiguous only shows it once."
