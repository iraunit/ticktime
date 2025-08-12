#!/bin/bash

# Wait for database to be ready (if using PostgreSQL)
if [ "$USE_POSTGRESQL" = "true" ]; then
    echo "Waiting for PostgreSQL..."
    while ! nc -z $DB_HOST $DB_PORT; do
        sleep 0.1
    done
    echo "PostgreSQL started"
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the server
exec "$@"