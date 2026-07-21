#!/usr/bin/env bash
#
# Deploy the latest Tutorly code on the TLJH server.
#
# IMPORTANT: installing the package is not enough. Each participant runs their
# own long-lived `jupyter-<user>` process that imported handlers.py at spawn
# time and keeps that module in memory. Until the process is restarted it keeps
# executing the OLD code, no matter what is on disk — and a browser refresh
# does NOT restart it. The giveaway in the logs is a traceback whose source
# lines don't match the named functions.
#
# Usage (on the VM):
#   sudo bash tools/update_tutorly.sh            # pull, install, restart all
#   sudo bash tools/update_tutorly.sh --no-pull  # install + restart only
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/jupyterlab-extension}"
TLJH_PIP="/opt/tljh/user/bin/pip"
DO_PULL=1
[[ "${1:-}" == "--no-pull" ]] && DO_PULL=0

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo (it restarts systemd services)." >&2
  exit 1
fi

cd "$REPO_DIR"

if [[ $DO_PULL -eq 1 ]]; then
  echo "==> Pulling latest code"
  git pull --ff-only
fi

echo "==> Installing into the TLJH user environment"
"$TLJH_PIP" install --no-deps .

echo "==> Verifying the installed copy matches the repo"
INSTALLED=$("/opt/tljh/user/bin/python" -c \
  "import jlab_ext_example.handlers as h; print(h.__file__)")
if diff -q "$REPO_DIR/jlab_ext_example/handlers.py" "$INSTALLED" >/dev/null; then
  echo "    OK: $INSTALLED"
else
  echo "    WARNING: installed handlers.py differs from the repo copy!" >&2
  echo "    installed: $INSTALLED" >&2
fi

# Restarting a participant's server drops their running kernel (notebook
# variables are lost). Study progress is safe — it lives in cache.db and
# Firebase, not in the kernel.
echo "==> Restarting single-user servers (this clears running kernels)"
mapfile -t UNITS < <(systemctl list-units 'jupyter-*' --state=running --no-legend \
                     | awk '{print $1}')
if [[ ${#UNITS[@]} -eq 0 ]]; then
  echo "    none running"
else
  for unit in "${UNITS[@]}"; do
    echo "    restarting $unit"
    systemctl restart "$unit"
  done
fi

echo "==> Reloading the hub"
tljh-config reload hub

echo
echo "Done. Confirm the new code is live, e.g.:"
echo "  sudo journalctl -u jupyter-<user> -n 50 | grep -i 'concept tags'"
