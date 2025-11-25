#!/bin/bash


# AWS EC2 Deployment Script
# Deploys React Web App and WebSocket Server

set -e  # Exit on error


# Output colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color


# Configuration
EC2_USER="ubuntu"
EC2_HOST="13.58.208.156"
EC2_SSH_KEY="/Users/isaku/Desktop/Helen/EC2-Key/Cloud-Key.pem"
PROJECT_ROOT="/Users/isaku/Desktop/Helen/Helen_v5.0.2"
WEB_APP_BUILD_DIR="$PROJECT_ROOT/frontend/web-app/dist"
WEBSOCKET_SERVER_DIR="$PROJECT_ROOT/backend/websocket-server"
BACKUP_DIR="/home/ubuntu/backups"


echo -e "${BLUE}==============================================="
echo -e "${BLUE}   DEPLOYMENT TO EC2 - HELEN WEB APP   "
echo -e "${BLUE}==============================================="
echo ""


# Logging functions
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}


# Check if build directory exists
if [ ! -d "$WEB_APP_BUILD_DIR" ]; then
    log_error "Build directory not found: $WEB_APP_BUILD_DIR"
    log_info "Run 'npm run build' first in frontend/web-app/"
    exit 1
fi

log_success "Build directory found"


# Step 1: Create backup on EC2
log_info "Creating backup on EC2..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    # Create backup directory if it does not exist
    mkdir -p /home/ubuntu/backups
    
    # Backup web app if it exists
    if [ -d "/var/www/helen" ]; then
        BACKUP_NAME="helen-web-$(date +%Y%m%d-%H%M%S).tar.gz"
        sudo tar -czf /home/ubuntu/backups/$BACKUP_NAME /var/www/helen 2>/dev/null || true
        echo "[SUCCESS] Backup created: $BACKUP_NAME"
    fi
    
    # Backup websocket server if it exists
    if [ -d "/home/ubuntu/backend/websocket-server" ]; then
        BACKUP_NAME="helen-websocket-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf /home/ubuntu/backups/$BACKUP_NAME /home/ubuntu/backend/websocket-server 2>/dev/null || true
        echo "[SUCCESS] Backup created: $BACKUP_NAME"
    fi
ENDSSH


log_success "Backup completed"


# Step 2: Create directories on EC2
log_info "Creating directories on EC2..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    # Directory for web app
    sudo mkdir -p /var/www/helen
    sudo chown ubuntu:ubuntu /var/www/helen
    
    # Directory for websocket server
    mkdir -p /home/ubuntu/backend/websocket-server
    
    echo "[SUCCESS] Directories created"
ENDSSH


log_success "Directories created"


# Step 3: Upload React Web App
log_info "Uploading React Web App..."
rsync -avz --delete \
    -e "ssh -i $EC2_SSH_KEY" \
    $WEB_APP_BUILD_DIR/ \
    $EC2_USER@$EC2_HOST:/var/www/helen/


log_success "React Web App uploaded"


# Step 4: Set permissions for web app
log_info "Setting permissions for web app..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo chown -R www-data:www-data /var/www/helen
    sudo chmod -R 755 /var/www/helen
    echo "[SUCCESS] Permissions set"
ENDSSH


log_success "Permissions configured"


# Step 5: Upload WebSocket Server
log_info "Uploading WebSocket Server..."
rsync -avz \
    -e "ssh -i $EC2_SSH_KEY" \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    $WEBSOCKET_SERVER_DIR/ \
    $EC2_USER@$EC2_HOST:/home/ubuntu/backend/websocket-server/


log_success "WebSocket Server uploaded"


# Step 6: Install Python dependencies
log_info "Installing Python dependencies..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    cd /home/ubuntu/backend/websocket-server
    
    # Install dependencies
    pip3 install -r requirements.txt --break-system-packages 2>&1 | grep -v "WARNING" || true
    
    echo "[SUCCESS] Dependencies installed"
ENDSSH


log_success "Python dependencies installed"


# Step 7: Create systemd service for WebSocket
log_info "Creating systemd service..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo tee /etc/systemd/system/helen-websocket.service > /dev/null << 'EOF'
[Unit]
Description=Helen WebSocket Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/backend/websocket-server
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 /home/ubuntu/backend/websocket-server/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "[SUCCESS] Systemd service created"
ENDSSH


log_success "Systemd service created"


# Step 8: Enable and start WebSocket service
log_info "Starting WebSocket service..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo systemctl daemon-reload
    sudo systemctl enable helen-websocket
    sudo systemctl restart helen-websocket
    
    # Esperar un momento
    sleep 2
    
    # Verificar status
    if sudo systemctl is-active --quiet helen-websocket; then
        echo "[SUCCESS] WebSocket service is running"
    else
        echo "[ERROR] WebSocket service failed to start"
        sudo journalctl -u helen-websocket -n 20 --no-pager
        exit 1
    fi
ENDSSH


log_success "WebSocket service started"


# Step 9: Configure Nginx
log_info "Configuring Nginx..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo tee /etc/nginx/sites-available/helen-web > /dev/null << 'EOF'
server {
    listen 3000;
    server_name 13.58.208.156;
    
    root /var/www/helen;
    index index.html;
    
    # React Router - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Create symlink if it does not exist
    if [ ! -L /etc/nginx/sites-enabled/helen-web ]; then
        sudo ln -s /etc/nginx/sites-available/helen-web /etc/nginx/sites-enabled/
    fi
    
    # Test nginx config
    if sudo nginx -t; then
        echo "[SUCCESS] Nginx configuration is valid"
    else
        echo "[ERROR] Nginx configuration has errors"
        exit 1
    fi
ENDSSH


log_success "Nginx configured"


# Step 10: Reload Nginx
log_info "Reloading Nginx..."
ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo systemctl reload nginx
    
    if sudo systemctl is-active --quiet nginx; then
        echo "[SUCCESS] Nginx reloaded successfully"
    else
        echo "[ERROR] Nginx failed to reload"
        exit 1
    fi
ENDSSH


log_success "Nginx reloaded"


# Step 11: Verify deployment
log_info "Verifying deployment..."
sleep 2

# Test WebSocket health
if ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:5001/health" | grep -q "healthy"; then
    log_success "WebSocket server is healthy"
else
    log_warning "WebSocket health check failed (might be expected if no /health endpoint)"
fi

# Test web app
if ssh -i $EC2_SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:3000" | grep -q "html"; then
    log_success "Web app is accessible"
else
    log_error "Web app is not accessible"
fi

# Final summary
echo ""
echo -e "${GREEN}==============================================="
echo -e "${GREEN}         DEPLOYMENT COMPLETED                  "
echo -e "${GREEN}==============================================="
echo ""
echo -e "${BLUE}React Web App:${NC}      http://13.58.208.156:3000"
echo -e "${BLUE}WebSocket Server:${NC}   Running on port 5001"
echo -e "${BLUE}Service Status:${NC}     sudo systemctl status helen-websocket"
echo -e "${BLUE}Logs:${NC}              sudo journalctl -u helen-websocket -f"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "   1. Open http://13.58.208.156:3000 in your browser"
echo "   2. Test camera and gesture recognition"
echo "   3. Configure Raspberry Pi to point to this URL"
echo ""
