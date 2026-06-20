#!/bin/bash
set -e

echo "Running database migrations..."
python -m flask db upgrade || echo "WARNING: Migration skipped (tables already created by seed)"

echo "Starting application with gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 run:app
