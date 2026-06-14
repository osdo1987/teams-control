#!/bin/bash
set -e

echo "Running database migrations..."
python -m flask db upgrade

echo "Starting application..."
python run.py