# 🚀 Deployment Scripts - Helen v5.0.2


# Helen v5.0.2 – AWS EC2 Deployment Guide

This folder contains the unified deployment script and configuration files for deploying the Helen Web App and WebSocket Server to an AWS EC2 instance.

---

## Deployment Script

### `deploy-to-ec2.sh` (Unified Deployment)

**Purpose:**
- Creates automatic backups of previous deployments
- Uploads the React Web App build
- Uploads the WebSocket Server and ML models
- Configures the systemd service for the WebSocket server
- Configures Nginx (HTTP or HTTPS)
- Verifies deployment and service health

**Usage:**
```bash
# 1. Edit configuration
nano deploy-to-ec2.sh
# Update EC2_SSH_KEY and other variables as needed

# 2. Make the script executable
chmod +x deploy-to-ec2.sh

# 3. Run the script
./deploy-to-ec2.sh
```

---

## Nginx Configuration

The recommended Nginx configuration is provided in `nginx-helen-web-https.conf` (for HTTPS with HTTP redirect). Update SSL certificate paths as needed.

---

## Initial Setup

1. **Edit SSH key and server details** in `deploy-to-ec2.sh`:
   ```bash
   EC2_SSH_KEY="~/.ssh/your-key.pem"  # Update this path
   EC2_HOST="your-ec2-public-ip"
   ```
2. **Verify SSH access:**
   ```bash
   ssh -i ~/.ssh/your-key.pem ubuntu@your-ec2-public-ip
   ```
3. **Update WebSocket URL in `.env` (frontend):**
   ```bash
   # frontend/web-app/.env
   VITE_WEBSOCKET_URL=http://your-ec2-public-ip:5001
   ```

---

## Useful EC2 Commands

**View WebSocket logs:**
```bash
sudo journalctl -u helen-websocket -f
```

**Check service status:**
```bash
sudo systemctl status helen-websocket
```

**Restart WebSocket manually:**
```bash
sudo systemctl restart helen-websocket
```

**View Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Test WebSocket health:**
```bash
curl http://localhost:5001/health
```

---

## Production URLs

- **Web App:** http://your-ec2-public-ip:3000
- **WebSocket:** ws://your-ec2-public-ip:5001
- **Flask API (if used):** http://your-ec2-public-ip:5000

---

## Troubleshooting

**WebSocket does not start:**
```bash
sudo journalctl -u helen-websocket -n 100 --no-pager
pip3 list | grep -E "flask|torch|socketio"
cd /home/ubuntu/backend/websocket-server
python3 server.py
```

**Web App does not load:**
```bash
sudo nginx -t
sudo systemctl status nginx
ls -la /var/www/helen/
curl http://localhost:3000
```

**Fix permissions:**
```bash
sudo chown -R www-data:www-data /var/www/helen
sudo chmod -R 755 /var/www/helen
```

---

## EC2 Directory Structure

```
/home/ubuntu/
└── backend/
    └── websocket-server/
        ├── server.py
        ├── requirements.txt
        └── trained_models/
            ├── model_final.pth
            ├── normalization_stats.pth
            └── gestures_map.json

/var/www/helen/
├── index.html
└── assets/
    ├── index-*.js
    └── index-*.css

/etc/systemd/system/
└── helen-websocket.service

/etc/nginx/sites-available/
└── helen-web
```

---

## Security Notes

- WebSocket server runs as user `ubuntu`
- Nginx runs as `www-data`
- Do not expose port 5001 externally (only via Nginx proxy)
- Keep backups in `/home/ubuntu/backups/`

---

## Post-Deployment Checklist

- [ ] Web app loads at http://your-ec2-public-ip:3000
- [ ] WebSocket connects successfully
- [ ] Camera works and detects hands
- [ ] Gestures are recognized (camera, weather, etc.)
- [ ] Navigation works between screens
- [ ] No errors in browser console
- [ ] WebSocket logs show connections
- [ ] Flask API on :5000 is still working (if used)

---

**Last update:** Deployment v1.0 – WebSocket + React Web App
    ├── index-*.js
