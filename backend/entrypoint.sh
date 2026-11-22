#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${SEED_ON_START:-true}" = "true" ]; then
  python manage.py seed_data
fi

exec "$@"
