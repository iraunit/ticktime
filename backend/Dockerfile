FROM python:3.13.5-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ARG SECRET_KEY
ARG DEBUG=True
ARG ALLOWED_HOSTS=localhost,127.0.0.1
ARG USE_POSTGRESQL=False
ARG DB_NAME=influencer_platform
ARG DB_USER=postgres
ARG DB_PASSWORD=password
ARG DB_HOST=localhost
ARG DB_PORT=5432
ARG EMAIL_HOST=smtp.gmail.com
ARG EMAIL_PORT=587
ARG EMAIL_USE_TLS=True
ARG EMAIL_HOST_USER
ARG EMAIL_HOST_PASSWORD
ARG GOOGLE_OAUTH2_CLIENT_ID
ARG GOOGLE_OAUTH2_CLIENT_SECRET
ARG REDIS_URL
ARG CELERY_BROKER_URL
ARG CELERY_RESULT_BACKEND

ENV SECRET_KEY=${SECRET_KEY}
ENV DEBUG=${DEBUG}
ENV ALLOWED_HOSTS=${ALLOWED_HOSTS}
ENV USE_POSTGRESQL=${USE_POSTGRESQL}
ENV DB_NAME=${DB_NAME}
ENV DB_USER=${DB_USER}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV EMAIL_HOST=${EMAIL_HOST}
ENV EMAIL_PORT=${EMAIL_PORT}
ENV EMAIL_USE_TLS=${EMAIL_USE_TLS}
ENV EMAIL_HOST_USER=${EMAIL_HOST_USER}
ENV EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
ENV GOOGLE_OAUTH2_CLIENT_ID=${GOOGLE_OAUTH2_CLIENT_ID}
ENV GOOGLE_OAUTH2_CLIENT_SECRET=${GOOGLE_OAUTH2_CLIENT_SECRET}
ENV REDIS_URL=${REDIS_URL}
ENV CELERY_BROKER_URL=${CELERY_BROKER_URL}
ENV CELERY_RESULT_BACKEND=${CELERY_RESULT_BACKEND}

# Expose port
EXPOSE 8000

# Set entrypoint
RUN chmod +x ./entrypoint.sh
RUN ./entrypoint.sh

# Run the application (Gunicorn)
CMD ["gunicorn", "backend.wsgi:application", "--workers=2", "--threads=2", "--bind=0.0.0.0:8000", "--timeout=300", "--log-level=info"]