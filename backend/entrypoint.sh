#!/bin/bash

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the server
echo "Starting process supervisor..."
exec "$@"