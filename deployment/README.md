# Deployment Files

This directory contains all the configuration files and scripts needed to deploy your JupyterLab extension as a web application using JupyterHub.

## Files Overview

### 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Comprehensive step-by-step deployment guide with detailed explanations
  - Covers all deployment options (DigitalOcean, AWS, GCP)
  - Includes troubleshooting section
  - Complete setup instructions from scratch

### 🔧 Configuration Files

- **jupyterhub_config.py** - Main JupyterHub configuration file
  - Configures authentication, spawner settings, and security
  - Sets resource limits per user
  - Enables your extension for all users
  - Location on server: `/etc/jupyterhub/jupyterhub_config.py`

- **jupyterhub.service** - Systemd service file for JupyterHub
  - Enables JupyterHub to run as a system service
  - Auto-starts on server boot
  - Location on server: `/etc/systemd/system/jupyterhub.service`

- **nginx-jupyterhub.conf** - Nginx reverse proxy configuration with SSL
  - For use with domain names
  - Includes SSL/HTTPS support (configured by certbot)
  - WebSocket support for JupyterLab
  - Location on server: `/etc/nginx/sites-available/jupyterhub`

- **nginx-jupyterhub-nossl.conf** - Nginx configuration without SSL
  - For use with IP addresses only
  - HTTP only (not recommended for production)
  - Location on server: `/etc/nginx/sites-available/jupyterhub`

- **env.template** - Environment variables template
  - Template for API keys and secrets
  - Copy to `/etc/jupyterhub/env` and fill in your values
  - Keep this file secure (chmod 600)

### 🚀 Automation Scripts

- **setup.sh** - Automated installation script
  - One-command setup for the entire deployment
  - Interactive prompts for configuration
  - Handles all installation steps automatically
  - Usage: `sudo bash setup.sh`

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Clone your repository on the server
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/jupyterlab-extension.git
cd jupyterlab-extension/deployment

# 2. Run the setup script
sudo bash setup.sh

# 3. Follow the prompts
```

### Option 2: Manual Setup

Follow the detailed instructions in **DEPLOYMENT_GUIDE.md**

## Prerequisites

- Fresh Ubuntu 22.04 server (DigitalOcean, AWS, GCP, etc.)
- Root or sudo access
- 2-4 GB RAM recommended
- OpenAI API key
- YouTube Data API key
- (Optional) Domain name for SSL

## What Gets Installed

The deployment will install and configure:

- ✅ Python 3.10+ with pip
- ✅ Node.js 20.x and npm
- ✅ JupyterHub (multi-user server)
- ✅ JupyterLab (notebook environment)
- ✅ Your JupyterLab extension (pre-installed for all users)
- ✅ Nginx (reverse proxy and SSL termination)
- ✅ Certbot (for SSL certificates)
- ✅ Systemd service (auto-start on boot)

## Access After Deployment

Once deployed, users can access your application at:

- **With domain:** `https://your-domain.com`
- **Without domain:** `http://YOUR_SERVER_IP`

Users will:
1. See the JupyterHub login/registration page
2. Create an account or log in
3. Get their own JupyterLab environment
4. Find your extension in the launcher (Chat, DataTable)
5. Use your extension with all features enabled

## Post-Deployment

### Create Admin User

```bash
# After first deployment, create an admin user
# Users can register at /hub/signup
# First user named "admin" will have admin privileges
```

### Update Extension

```bash
cd /opt/jupyterlab-extension
sudo git pull
sudo pip install -e . --force-reinstall
sudo systemctl restart jupyterhub
```

### View Logs

```bash
# JupyterHub logs
sudo journalctl -u jupyterhub -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Manage Service

```bash
# Start JupyterHub
sudo systemctl start jupyterhub

# Stop JupyterHub
sudo systemctl stop jupyterhub

# Restart JupyterHub
sudo systemctl restart jupyterhub

# Check status
sudo systemctl status jupyterhub
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Users (Browser)                 │
└─────────────────┬───────────────────────────┘
                  │ HTTPS/HTTP
┌─────────────────▼───────────────────────────┐
│         Nginx (Reverse Proxy)                │
│         - SSL Termination                    │
│         - WebSocket Support                  │
└─────────────────┬───────────────────────────┘
                  │ HTTP (localhost:8000)
┌─────────────────▼───────────────────────────┐
│            JupyterHub                        │
│         - Authentication                     │
│         - User Management                    │
│         - Proxy Management                   │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────┐         ┌───────▼───────┐
│  User 1   │   ...   │   User N      │
│ JupyterLab│         │  JupyterLab   │
│ + Extension│        │  + Extension  │
└───────────┘         └───────────────┘
```

## Security Considerations

1. **Always use HTTPS in production** - Get a free SSL certificate with Let's Encrypt
2. **Keep API keys secure** - Store in `/etc/jupyterhub/env` with 600 permissions
3. **Regular updates** - Keep system packages and dependencies updated
4. **Firewall rules** - Only allow necessary ports (80, 443, 22)
5. **User authentication** - Use OAuth (GitHub/Google) for better security
6. **Resource limits** - Set memory/CPU limits per user in config
7. **Regular backups** - Back up configuration and user data

## Troubleshooting

See the **DEPLOYMENT_GUIDE.md** troubleshooting section for common issues and solutions.

## Estimated Costs

- **DigitalOcean:** $12-24/month (2-4 GB RAM droplet)
- **AWS EC2:** $15-30/month (t3.small/medium)
- **GCP Compute:** Similar to AWS
- **Domain name:** $10-15/year (optional)

Total: ~$150-360/year

## Support

For issues or questions:
1. Check the troubleshooting section in DEPLOYMENT_GUIDE.md
2. Review logs: `sudo journalctl -u jupyterhub -f`
3. JupyterHub docs: https://jupyterhub.readthedocs.io/
4. JupyterLab docs: https://jupyterlab.readthedocs.io/

## License

Same as the main project.
