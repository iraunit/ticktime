# InfluencerConnect Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Configuration](#database-configuration)
6. [Production Considerations](#production-considerations)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies

#### Backend Dependencies
- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Nginx 1.18+
- Supervisor (for process management)

#### Frontend Dependencies
- Node.js 18+
- npm 9+ or yarn 1.22+

#### Optional Dependencies
- Docker & Docker Compose (for containerized deployment)
- SSL Certificate (Let's Encrypt recommended)
- CDN service (CloudFlare, AWS CloudFront)

## Environment Setup

### 1. Server Preparation

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### Install Python and Dependencies
```bash
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y redis-server
sudo apt install -y nginx
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. User Setup

Create a dedicated user for the application:
```bash
sudo adduser influencerconnect
sudo usermod -aG sudo influencerconnect
su - influencerconnect
```

### 3. Directory Structure

Create application directories:
```bash
mkdir -p /home/influencerconnect/app
mkdir -p /home/influencerconnect/logs
mkdir -p /home/influencerconnect/backups
mkdir -p /home/influencerconnect/media
mkdir -p /home/influencerconnect/static
```

## Backend Deployment

### 1. Clone Repository

```bash
cd /home/influencerconnect/app
git clone https://github.com/your-org/influencerconnect.git .
```

### 2. Python Environment Setup

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Environment Configuration

Create production environment file:
```bash
cp .env.example .env
```

Edit `.env` with production values:
```env
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/influencerconnect

# Redis
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File Storage
MEDIA_ROOT=/home/influencerconnect/media
STATIC_ROOT=/home/influencerconnect/static

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### 4. Database Setup

#### Create Database
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE influencerconnect;
CREATE USER influencerconnect_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE influencerconnect TO influencerconnect_user;
ALTER USER influencerconnect_user CREATEDB;
\q
```

#### Run Migrations
```bash
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 5. Gunicorn Configuration

Create Gunicorn configuration file:
```bash
nano /home/influencerconnect/app/backend/gunicorn.conf.py
```

```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

### 6. Supervisor Configuration

Create supervisor configuration:
```bash
sudo nano /etc/supervisor/conf.d/influencerconnect.conf
```

```ini
[program:influencerconnect]
command=/home/influencerconnect/app/backend/venv/bin/gunicorn backend.wsgi:application -c gunicorn.conf.py
directory=/home/influencerconnect/app/backend
user=influencerconnect
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/influencerconnect/logs/gunicorn.log
environment=PATH="/home/influencerconnect/app/backend/venv/bin"

[program:celery]
command=/home/influencerconnect/app/backend/venv/bin/celery -A backend worker -l info
directory=/home/influencerconnect/app/backend
user=influencerconnect
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/influencerconnect/logs/celery.log
environment=PATH="/home/influencerconnect/app/backend/venv/bin"
```

Start services:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start influencerconnect
sudo supervisorctl start celery
```

## Frontend Deployment

### 1. Build Frontend

```bash
cd /home/influencerconnect/app/frontend
npm install
npm run build
```

### 2. Environment Configuration

Create production environment file:
```bash
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. PM2 Configuration (Alternative to Supervisor)

Install PM2:
```bash
sudo npm install -g pm2
```

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'influencerconnect-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/influencerconnect/app/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Start frontend:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Configuration

### 1. PostgreSQL Optimization

Edit PostgreSQL configuration:
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Key settings for production:
```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connections
max_connections = 100

# Logging
log_statement = 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

### 2. Redis Configuration

Edit Redis configuration:
```bash
sudo nano /etc/redis/redis.conf
```

Key settings:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

Restart services:
```bash
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

## Production Considerations

### 1. Nginx Configuration

Create Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/influencerconnect
```

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # API Routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files
    location /static/ {
        alias /home/influencerconnect/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media Files
    location /media/ {
        alias /home/influencerconnect/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend Routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File Upload Size
    client_max_body_size 100M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/influencerconnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. SSL Certificate

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Log Rotation

Create logrotate configuration:
```bash
sudo nano /etc/logrotate.d/influencerconnect
```

```
/home/influencerconnect/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 influencerconnect influencerconnect
    postrotate
        supervisorctl restart influencerconnect
        supervisorctl restart celery
    endscript
}
```

## Monitoring & Logging

### 1. System Monitoring

Install monitoring tools:
```bash
sudo apt install htop iotop nethogs
```

### 2. Application Monitoring

Create health check endpoint monitoring:
```bash
nano /home/influencerconnect/scripts/health_check.sh
```

```bash
#!/bin/bash
curl -f http://localhost:8000/api/health/ || exit 1
curl -f http://localhost:3000/api/health || exit 1
```

Add to crontab:
```bash
crontab -e
```

```
*/5 * * * * /home/influencerconnect/scripts/health_check.sh
```

### 3. Log Monitoring

Install and configure log monitoring:
```bash
sudo apt install fail2ban
```

Configure fail2ban:
```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

## Backup & Recovery

### 1. Database Backup

Create backup script:
```bash
nano /home/influencerconnect/scripts/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/influencerconnect/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="influencerconnect"

pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### 2. Media Files Backup

```bash
nano /home/influencerconnect/scripts/backup_media.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/influencerconnect/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MEDIA_DIR="/home/influencerconnect/media"

tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz -C $MEDIA_DIR .

# Keep only last 7 days of media backups
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +7 -delete
```

### 3. Automated Backups

Add to crontab:
```bash
crontab -e
```

```
0 2 * * * /home/influencerconnect/scripts/backup_db.sh
0 3 * * 0 /home/influencerconnect/scripts/backup_media.sh
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check supervisor status
sudo supervisorctl status

# Check logs
tail -f /home/influencerconnect/logs/gunicorn.log
tail -f /home/influencerconnect/logs/celery.log

# Restart services
sudo supervisorctl restart influencerconnect
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U influencerconnect_user -d influencerconnect

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 3. High Memory Usage
```bash
# Check memory usage
free -h
htop

# Optimize PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Adjust shared_buffers and work_mem

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Analyze database performance
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Create indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_deals_status ON core_deal(status);
CREATE INDEX CONCURRENTLY idx_deals_influencer ON core_deal(influencer_id);
```

#### 2. Redis Optimization
```bash
# Monitor Redis performance
redis-cli info memory
redis-cli info stats

# Clear cache if needed
redis-cli flushall
```

#### 3. Nginx Optimization
```nginx
# Add to nginx configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Emergency Procedures

#### 1. Service Recovery
```bash
# Stop all services
sudo supervisorctl stop all
pm2 stop all

# Start services in order
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo supervisorctl start influencerconnect
sudo supervisorctl start celery
pm2 start all
```

#### 2. Database Recovery
```bash
# Restore from backup
gunzip /home/influencerconnect/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
psql influencerconnect < /home/influencerconnect/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

#### 3. Rollback Deployment
```bash
# Switch to previous version
cd /home/influencerconnect/app
git checkout previous-stable-tag

# Rebuild and restart
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

cd ../frontend
npm install
npm run build

# Restart services
sudo supervisorctl restart influencerconnect
pm2 restart all
```

---

## Support

For deployment support, contact:
- **Technical Support**: tech-support@influencerconnect.com
- **Documentation**: https://docs.influencerconnect.com
- **Emergency**: +1-555-SUPPORT (24/7)