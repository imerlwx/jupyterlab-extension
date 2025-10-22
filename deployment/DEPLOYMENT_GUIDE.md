# JupyterHub Cloud Deployment Guide

This guide will walk you through deploying your JupyterLab extension as a web application using JupyterHub on a cloud VM.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Cloud VM Setup](#step-1-cloud-vm-setup)
4. [Step 2: Initial Server Configuration](#step-2-initial-server-configuration)
5. [Step 3: Install Dependencies](#step-3-install-dependencies)
6. [Step 4: Install Your Extension](#step-4-install-your-extension)
7. [Step 5: Configure JupyterHub](#step-5-configure-jupyterhub)
8. [Step 6: Set Up Authentication](#step-6-set-up-authentication)
9. [Step 7: Configure Domain & SSL](#step-7-configure-domain--ssl)
10. [Step 8: Start JupyterHub as a Service](#step-8-start-jupyterhub-as-a-service)
11. [Troubleshooting](#troubleshooting)

---

## Overview

**Architecture:**
```
Users → Domain (https://your-domain.com)
    → Nginx (SSL termination)
    → JupyterHub (port 8000)
    → User JupyterLab servers (with your extension pre-installed)
```

**Estimated Costs:**
- DigitalOcean: $12-24/month (2-4 GB RAM recommended)
- AWS EC2: $15-30/month (t3.small or t3.medium)
- GCP Compute Engine: Similar to AWS
- Domain name: $10-15/year (optional but recommended)

**Time to Deploy:** 1-2 hours

---

## Prerequisites

### What You'll Need:

1. **Cloud Provider Account** (choose one):
   - [DigitalOcean](https://www.digitalocean.com/) (easiest for beginners)
   - [AWS](https://aws.amazon.com/)
   - [Google Cloud Platform](https://cloud.google.com/)

2. **API Keys** (for your extension):
   - OpenAI API key ([get one here](https://platform.openai.com/api-keys))
   - YouTube Data API key ([get one here](https://console.cloud.google.com/apis/credentials))

3. **Domain Name** (optional but recommended):
   - From [Namecheap](https://www.namecheap.com/), [Google Domains](https://domains.google/), etc.
   - Or use cloud provider's IP address directly

4. **Basic Linux Knowledge**:
   - SSH access
   - Basic command line operations

---

## Step 1: Cloud VM Setup

### Option A: DigitalOcean (Recommended for Beginners)

1. **Create a Droplet:**
   - Log in to [DigitalOcean](https://www.digitalocean.com/)
   - Click "Create" → "Droplets"
   - Choose:
     - **Image:** Ubuntu 22.04 LTS
     - **Plan:** Basic
     - **CPU:** Regular (2 GB RAM minimum, 4 GB recommended)
     - **Datacenter:** Closest to your users
     - **Authentication:** SSH keys (recommended) or Password
   - Click "Create Droplet"

2. **Note your IP address** (e.g., `157.230.xxx.xxx`)

### Option B: AWS EC2

1. **Launch an Instance:**
   - Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
   - Click "Launch Instance"
   - Choose:
     - **AMI:** Ubuntu Server 22.04 LTS
     - **Instance Type:** t3.small (2 GB RAM) or t3.medium (4 GB RAM)
     - **Key pair:** Create or select existing
     - **Security Group:** Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Click "Launch"

2. **Configure Security Group:**
   ```
   SSH     (22)   - Your IP
   HTTP    (80)   - 0.0.0.0/0
   HTTPS   (443)  - 0.0.0.0/0
   ```

### Option C: Google Cloud Platform

1. **Create a VM Instance:**
   - Go to [GCP Compute Engine](https://console.cloud.google.com/compute/instances)
   - Click "Create Instance"
   - Choose:
     - **Machine type:** e2-small or e2-medium
     - **Boot disk:** Ubuntu 22.04 LTS
     - **Firewall:** Allow HTTP and HTTPS traffic
   - Click "Create"

2. **Configure Firewall Rules** to allow ports 80, 443

---

## Step 2: Initial Server Configuration

### Connect to Your Server

```bash
# Replace with your server IP and key path
ssh root@YOUR_SERVER_IP

# Or for AWS:
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

### Create a Non-Root User (Security Best Practice)

```bash
# Create a new user
adduser jupyterhub-admin

# Add to sudo group
usermod -aG sudo jupyterhub-admin

# Switch to new user
su - jupyterhub-admin
```

### Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Configure Firewall

```bash
# Allow OpenSSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## Step 3: Install Dependencies

### Install Python and Node.js

```bash
# Install Python 3.11 and pip
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Install Node.js (for JupyterLab extensions)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
python3 --version  # Should be 3.10+
node --version     # Should be 20.x
npm --version
```

### Install System Dependencies

```bash
# Install build tools and other dependencies
sudo apt install -y \
    build-essential \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    curl \
    wget
```

### Install JupyterHub and JupyterLab

```bash
# Create a virtual environment (optional but recommended)
sudo python3 -m venv /opt/jupyterhub
source /opt/jupyterhub/bin/activate

# Or install globally
sudo python3 -m pip install --upgrade pip
sudo python3 -m pip install jupyterhub jupyterlab notebook
sudo python3 -m pip install jupyterhub-nativeauthenticator  # For user registration

# Install Node.js proxy (required for JupyterHub)
sudo npm install -g configurable-http-proxy

# Verify installation
jupyterhub --version
jupyter lab --version
```

---

## Step 4: Install Your Extension

### Clone Your Repository

```bash
# Navigate to a suitable directory
cd /opt

# Clone your extension repository
sudo git clone https://github.com/YOUR_USERNAME/jupyterlab-extension.git
cd jupyterlab-extension

# Set proper permissions
sudo chown -R $USER:$USER /opt/jupyterlab-extension
```

### Install the Extension

```bash
# If using virtual environment:
source /opt/jupyterhub/bin/activate

# Install in development mode
sudo pip install -e .

# Verify the extension is installed
jupyter labextension list
jupyter server extension list

# You should see:
# - jlab_ext_example enabled (server extension)
# - jlab_ext_example enabled (lab extension)
```

### Set Up Environment Variables for API Keys

```bash
# Create environment file
sudo mkdir -p /etc/jupyterhub
sudo nano /etc/jupyterhub/env

# Add your API keys:
export OPENAI_API_KEY="your-openai-api-key-here"
export YOUTUBE_API_KEY="your-youtube-api-key-here"

# Save and exit (Ctrl+X, Y, Enter)

# Secure the file
sudo chmod 600 /etc/jupyterhub/env
```

---

## Step 5: Configure JupyterHub

### Create JupyterHub Configuration Directory

```bash
sudo mkdir -p /etc/jupyterhub
cd /etc/jupyterhub
```

### Generate Default Configuration

```bash
sudo jupyterhub --generate-config
# This creates jupyterhub_config.py
```

### Use the Provided Configuration

Copy the `jupyterhub_config.py` from the deployment folder:

```bash
sudo cp /opt/jupyterlab-extension/deployment/jupyterhub_config.py /etc/jupyterhub/jupyterhub_config.py
```

**Key configurations in this file:**
- Spawns JupyterLab (not Notebook) by default
- Pre-installs your extension in each user environment
- Sets up authentication
- Configures resource limits
- Sets up logging

### Create JupyterHub Directory Structure

```bash
# Create necessary directories
sudo mkdir -p /var/log/jupyterhub
sudo mkdir -p /srv/jupyterhub
sudo mkdir -p /etc/jupyterhub/ssl

# Set permissions
sudo chmod 755 /var/log/jupyterhub
sudo chmod 755 /srv/jupyterhub
```

---

## Step 6: Set Up Authentication

JupyterHub supports multiple authentication methods. Choose one:

### Option A: Native Authenticator (User Registration)

**Pros:** Users can self-register, no external dependencies
**Best for:** Small teams, educational settings

Already configured in `jupyterhub_config.py`. Users can register at `/hub/signup`.

### Option B: GitHub OAuth (Recommended for Open Access)

**Pros:** Easy for users, leverages GitHub accounts
**Best for:** Developer communities, open projects

1. **Create GitHub OAuth App:**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Fill in:
     - **Application name:** Your Extension Name
     - **Homepage URL:** `https://your-domain.com`
     - **Authorization callback URL:** `https://your-domain.com/hub/oauth_callback`
   - Note your **Client ID** and **Client Secret**

2. **Install GitHub authenticator:**
   ```bash
   sudo pip install oauthenticator
   ```

3. **Update `/etc/jupyterhub/jupyterhub_config.py`:**
   ```python
   # Replace the authenticator section with:
   from oauthenticator.github import GitHubOAuthenticator
   c.JupyterHub.authenticator_class = GitHubOAuthenticator
   c.GitHubOAuthenticator.oauth_callback_url = 'https://your-domain.com/hub/oauth_callback'
   c.GitHubOAuthenticator.client_id = 'your-github-client-id'
   c.GitHubOAuthenticator.client_secret = 'your-github-client-secret'
   ```

### Option C: Google OAuth

1. **Install Google authenticator:**
   ```bash
   sudo pip install oauthenticator
   ```

2. **Create Google OAuth credentials** at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

3. **Update configuration** similarly to GitHub OAuth

---

## Step 7: Configure Domain & SSL

### Option A: Using a Domain Name (Recommended)

#### 1. Point Domain to Your Server

In your domain registrar (Namecheap, Google Domains, etc.):
- Create an **A record** pointing to your server's IP address:
  ```
  Type: A
  Name: @ (or your-subdomain)
  Value: YOUR_SERVER_IP
  TTL: 3600
  ```

#### 2. Configure Nginx as Reverse Proxy

Copy the provided nginx configuration:

```bash
sudo cp /opt/jupyterlab-extension/deployment/nginx-jupyterhub.conf /etc/nginx/sites-available/jupyterhub

# Edit the file to add your domain
sudo nano /etc/nginx/sites-available/jupyterhub

# Replace YOUR_DOMAIN with your actual domain
# Save and exit

# Enable the site
sudo ln -s /etc/nginx/sites-available/jupyterhub /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### 3. Get SSL Certificate with Let's Encrypt

```bash
# Get SSL certificate (replace with your email and domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Certbot will automatically configure nginx for SSL
```

#### 4. Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Option B: Using IP Address Only (Not Recommended for Production)

If you don't have a domain, you can access via IP:

```bash
# Configure nginx for HTTP only
sudo cp /opt/jupyterlab-extension/deployment/nginx-jupyterhub-nossl.conf /etc/nginx/sites-available/jupyterhub

# Edit and replace YOUR_SERVER_IP
sudo nano /etc/nginx/sites-available/jupyterhub

# Enable and restart
sudo ln -s /etc/nginx/sites-available/jupyterhub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

**Warning:** Without SSL, connections are not encrypted. Only use this for testing.

---

## Step 8: Start JupyterHub as a Service

### Create Systemd Service File

Copy the provided service file:

```bash
sudo cp /opt/jupyterlab-extension/deployment/jupyterhub.service /etc/systemd/system/jupyterhub.service

# Reload systemd
sudo systemctl daemon-reload
```

### Start JupyterHub

```bash
# Enable JupyterHub to start on boot
sudo systemctl enable jupyterhub

# Start JupyterHub
sudo systemctl start jupyterhub

# Check status
sudo systemctl status jupyterhub

# View logs if needed
sudo journalctl -u jupyterhub -f
```

### Verify Everything Works

1. **Open your browser** and navigate to:
   - With domain: `https://your-domain.com`
   - With IP: `http://YOUR_SERVER_IP`

2. **You should see the JupyterHub login page**

3. **Register or log in** (depending on your authentication method)

4. **Once logged in:**
   - You should see JupyterLab interface
   - Your extension should appear in the launcher
   - Click on "Chat" or "DataTable" to verify the extension works

---

## Maintenance Commands

### Restart JupyterHub

```bash
sudo systemctl restart jupyterhub
```

### View Logs

```bash
# JupyterHub logs
sudo journalctl -u jupyterhub -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Your Extension

```bash
cd /opt/jupyterlab-extension
sudo git pull
sudo pip install -e . --force-reinstall
sudo systemctl restart jupyterhub
```

### Add More Users (Native Authenticator)

Users can self-register at `/hub/signup`, or admin can add them via JupyterHub admin panel.

---

## Troubleshooting

### JupyterHub Won't Start

```bash
# Check status and logs
sudo systemctl status jupyterhub
sudo journalctl -u jupyterhub -n 50

# Common issues:
# 1. Port 8000 already in use
sudo lsof -i :8000
sudo kill -9 <PID>

# 2. Configuration errors
sudo jupyterhub --config /etc/jupyterhub/jupyterhub_config.py --debug
```

### Extension Not Appearing

```bash
# Verify extension is installed
jupyter labextension list
jupyter server extension list

# Rebuild JupyterLab
jupyter lab build

# Clear browser cache and hard reload (Ctrl+Shift+R)
```

### SSL Certificate Issues

```bash
# Check nginx configuration
sudo nginx -t

# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx
```

### Users Can't Connect

```bash
# Check firewall
sudo ufw status

# Ensure ports are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check nginx is running
sudo systemctl status nginx

# Check JupyterHub is running
sudo systemctl status jupyterhub
```

### API Keys Not Working

```bash
# Verify environment variables are loaded
sudo systemctl status jupyterhub
# Look for environment variables in the process

# Check the env file
sudo cat /etc/jupyterhub/env

# Ensure the service file sources the env file
sudo systemctl cat jupyterhub
```

### Database Lock Errors (SQLite)

```bash
# If you see "database is locked" errors:
cd /opt/jupyterlab-extension/jlab_ext_example
sudo chmod 666 cache.db
sudo chmod 777 .  # directory needs write permission
```

### Performance Issues

```bash
# Check system resources
htop
free -h
df -h

# Consider upgrading VM if:
# - RAM usage > 80%
# - CPU constantly at 100%
# - Disk full

# Limit concurrent users in jupyterhub_config.py:
c.JupyterHub.concurrent_spawn_limit = 5
```

---

## Security Best Practices

1. **Always use SSL/HTTPS in production**
2. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. **Use strong passwords** or OAuth authentication
4. **Regular backups:**
   ```bash
   # Backup important files
   sudo tar -czf jupyterhub-backup-$(date +%Y%m%d).tar.gz \
       /etc/jupyterhub \
       /opt/jupyterlab-extension \
       /home/*/notebooks
   ```
5. **Monitor logs** regularly for suspicious activity
6. **Limit user resources** in JupyterHub config
7. **Keep API keys secure** (never commit to git)

---

## Upgrading

### Update JupyterHub/JupyterLab

```bash
sudo pip install --upgrade jupyterhub jupyterlab
sudo systemctl restart jupyterhub
```

### Update Your Extension

```bash
cd /opt/jupyterlab-extension
sudo git pull
sudo pip install -e . --upgrade
sudo systemctl restart jupyterhub
```

---

## Cost Optimization

1. **Start small:** Begin with 2 GB RAM, scale up if needed
2. **Use reserved instances:** AWS/GCP offer discounts for 1-year commitments
3. **Set up monitoring:** Alert when resources are underutilized
4. **Consider spot instances:** For non-critical workloads (AWS)

---

## Next Steps

Once deployed, you can:

1. **Customize the landing page** (edit `/opt/jupyterhub/share/jupyterhub/templates/`)
2. **Add custom documentation** for your users
3. **Set up monitoring** (Prometheus + Grafana)
4. **Configure backups** (automated snapshots)
5. **Scale horizontally** (add more servers with JupyterHub on Kubernetes)

---

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review logs: `sudo journalctl -u jupyterhub -f`
3. JupyterHub documentation: https://jupyterhub.readthedocs.io/
4. JupyterLab documentation: https://jupyterlab.readthedocs.io/

---

## Summary

Congratulations! You've deployed your JupyterLab extension as a web application. Users can now:

- Access it via your domain/IP
- Log in and get their own JupyterLab environment
- Use your extension without any installation
- Have persistent notebooks and data

**URL to share:** `https://your-domain.com` or `http://YOUR_SERVER_IP`

Enjoy your deployment!
