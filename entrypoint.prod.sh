#!/bin/bash
set -e

echo "Running database migrations..."
python -m flask db upgrade

echo "Starting application with gunicorn..."
gunicorn --bind 0.0.0.0:5000 run:app