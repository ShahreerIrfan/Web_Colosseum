#!/bin/sh
set -eu

OUT_FILE="/usr/share/nginx/html/env-config.js"

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\r//g' | tr '\n' ' '
}

{
  printf 'window.__ENV__ = Object.assign({}, window.__ENV__ || {});\n'
  for VAR_NAME in VITE_BACKEND_URL VITE_FRONTEND_URL VITE_PRIVACY_OPERATOR VITE_PRIVACY_CONTACT_EMAIL; do
    eval "VAR_VAL=\${$VAR_NAME:-}"
    if [ -n "$VAR_VAL" ]; then
      ESCAPED="$(escape_js "$VAR_VAL")"
      printf 'window.__ENV__.%s = "%s";\n' "$VAR_NAME" "$ESCAPED"
    fi
  done
} > "$OUT_FILE"
