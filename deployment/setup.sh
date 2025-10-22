#!/bin/bash

# JupyterHub Deployment Setup Script
# This script automates the installation and configuration of JupyterHub
# with your JupyterLab extension on a fresh Ubuntu 22.04 server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo or as root"
    exit 1
fi

print_header "JupyterHub Deployment Setup"

echo "This script will:"
echo "  1. Update system packages"
echo "  2. Install Python, Node.js, and dependencies"
echo "  3. Install JupyterHub and JupyterLab"
echo "  4. Install your JupyterLab extension"
echo "  5. Configure JupyterHub"
echo "  6. Set up systemd service"
echo "  7. Configure nginx"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Setup cancelled"
    exit 0
fi

# Get user inputs
print_header "Configuration"

read -p "Do you have a domain name? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    HAS_DOMAIN=true
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
else
    HAS_DOMAIN=false
    DOMAIN_NAME=$(hostname -I | awk '{print $1}')
    print_warning "Will use IP address: $DOMAIN_NAME"
fi

read -p "Enter OpenAI API key: " OPENAI_KEY
read -p "Enter YouTube API key: " YOUTUBE_KEY

# Step 1: Update system
print_header "Step 1: Updating System Packages"
apt update
apt upgrade -y
print_success "System packages updated"

# Step 2: Install dependencies
print_header "Step 2: Installing Dependencies"

# Install Python
print_success "Installing Python..."
apt install -y python3 python3-pip python3-venv python3-dev

# Install Node.js
print_success "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install other dependencies
print_success "Installing system dependencies..."
apt install -y build-essential git nginx certbot python3-certbot-nginx curl wget

print_success "All dependencies installed"

# Step 3: Install JupyterHub and JupyterLab
print_header "Step 3: Installing JupyterHub and JupyterLab"

pip3 install --upgrade pip
pip3 install jupyterhub jupyterlab notebook ipywidgets
pip3 install jupyterhub-nativeauthenticator
pip3 install jupyterhub-idle-culler

# Install Node.js proxy
npm install -g configurable-http-proxy

print_success "JupyterHub and JupyterLab installed"

# Verify installations
echo "Versions installed:"
echo "  JupyterHub: $(jupyterhub --version)"
echo "  JupyterLab: $(jupyter lab --version)"
echo "  Node.js: $(node --version)"

# Step 4: Install the extension
print_header "Step 4: Installing JupyterLab Extension"

EXTENSION_DIR="/opt/jupyterlab-extension"

if [ -d "$EXTENSION_DIR" ]; then
    print_warning "Extension directory already exists at $EXTENSION_DIR"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd $EXTENSION_DIR
        git pull
    fi
else
    print_warning "Please clone your extension repository to $EXTENSION_DIR"
    print_warning "Or specify the path where the extension is located:"
    read -p "Extension path (press Enter for $EXTENSION_DIR): " CUSTOM_PATH
    if [ ! -z "$CUSTOM_PATH" ]; then
        EXTENSION_DIR=$CUSTOM_PATH
    fi
fi

if [ -d "$EXTENSION_DIR" ]; then
    cd $EXTENSION_DIR
    pip3 install -e .

    # Verify extension is installed
    if jupyter labextension list | grep -q "jlab_ext_example"; then
        print_success "Extension installed successfully"
    else
        print_error "Extension installation failed"
        exit 1
    fi
else
    print_error "Extension directory not found: $EXTENSION_DIR"
    exit 1
fi

# Step 5: Configure JupyterHub
print_header "Step 5: Configuring JupyterHub"

# Create directories
mkdir -p /etc/jupyterhub
mkdir -p /srv/jupyterhub
mkdir -p /var/log/jupyterhub

# Copy configuration file
if [ -f "$EXTENSION_DIR/deployment/jupyterhub_config.py" ]; then
    cp $EXTENSION_DIR/deployment/jupyterhub_config.py /etc/jupyterhub/jupyterhub_config.py
    print_success "JupyterHub configuration file copied"
else
    print_error "Configuration file not found: $EXTENSION_DIR/deployment/jupyterhub_config.py"
    exit 1
fi

# Create environment file
cat > /etc/jupyterhub/env << EOF
export OPENAI_API_KEY="$OPENAI_KEY"
export YOUTUBE_API_KEY="$YOUTUBE_KEY"
export CONFIGPROXY_AUTH_TOKEN="$(openssl rand -hex 32)"
EOF

chmod 600 /etc/jupyterhub/env
print_success "Environment variables configured"

# Step 6: Set up systemd service
print_header "Step 6: Setting up Systemd Service"

if [ -f "$EXTENSION_DIR/deployment/jupyterhub.service" ]; then
    cp $EXTENSION_DIR/deployment/jupyterhub.service /etc/systemd/system/jupyterhub.service
    systemctl daemon-reload
    systemctl enable jupyterhub
    print_success "Systemd service configured"
else
    print_error "Service file not found: $EXTENSION_DIR/deployment/jupyterhub.service"
    exit 1
fi

# Step 7: Configure nginx
print_header "Step 7: Configuring Nginx"

if [ "$HAS_DOMAIN" = true ]; then
    # Use domain configuration
    if [ -f "$EXTENSION_DIR/deployment/nginx-jupyterhub.conf" ]; then
        cp $EXTENSION_DIR/deployment/nginx-jupyterhub.conf /etc/nginx/sites-available/jupyterhub
        sed -i "s/YOUR_DOMAIN/$DOMAIN_NAME/g" /etc/nginx/sites-available/jupyterhub
    else
        print_error "Nginx config not found: $EXTENSION_DIR/deployment/nginx-jupyterhub.conf"
        exit 1
    fi
else
    # Use IP-only configuration
    if [ -f "$EXTENSION_DIR/deployment/nginx-jupyterhub-nossl.conf" ]; then
        cp $EXTENSION_DIR/deployment/nginx-jupyterhub-nossl.conf /etc/nginx/sites-available/jupyterhub
    else
        print_error "Nginx config not found: $EXTENSION_DIR/deployment/nginx-jupyterhub-nossl.conf"
        exit 1
    fi
fi

# Enable the site
ln -sf /etc/nginx/sites-available/jupyterhub /etc/nginx/sites-enabled/jupyterhub
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if nginx -t; then
    systemctl restart nginx
    print_success "Nginx configured and restarted"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 8: Start JupyterHub
print_header "Step 8: Starting JupyterHub"

systemctl start jupyterhub

# Wait a moment for startup
sleep 3

if systemctl is-active --quiet jupyterhub; then
    print_success "JupyterHub started successfully"
else
    print_error "JupyterHub failed to start"
    echo "Check logs with: sudo journalctl -u jupyterhub -n 50"
    exit 1
fi

# Step 9: SSL Setup (if domain provided)
if [ "$HAS_DOMAIN" = true ]; then
    print_header "Step 9: SSL Certificate Setup"

    read -p "Do you want to set up SSL with Let's Encrypt now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your email for Let's Encrypt: " EMAIL

        # Uncomment the HTTPS server block
        sed -i 's/^# server {/server {/' /etc/nginx/sites-available/jupyterhub
        sed -i 's/^#     /    /' /etc/nginx/sites-available/jupyterhub
        sed -i 's/^# }/}/' /etc/nginx/sites-available/jupyterhub

        # Get certificate
        certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive

        if [ $? -eq 0 ]; then
            print_success "SSL certificate obtained and configured"

            # Enable HTTP to HTTPS redirect
            sed -i 's/# return 301/return 301/' /etc/nginx/sites-available/jupyterhub

            systemctl restart nginx
        else
            print_warning "SSL certificate setup failed - you can run certbot manually later"
        fi
    else
        print_warning "Skipping SSL setup - you can run it later with:"
        echo "  sudo certbot --nginx -d $DOMAIN_NAME"
    fi
fi

# Final summary
print_header "Installation Complete!"

echo -e "${GREEN}✓ JupyterHub is now running${NC}"
echo ""
echo "Access your JupyterHub at:"
if [ "$HAS_DOMAIN" = true ]; then
    echo -e "  ${BLUE}https://$DOMAIN_NAME${NC}"
else
    echo -e "  ${BLUE}http://$DOMAIN_NAME${NC}"
fi
echo ""
echo "Default admin user: admin"
echo "Users can register at: /hub/signup"
echo ""
echo "Useful commands:"
echo "  Start:   sudo systemctl start jupyterhub"
echo "  Stop:    sudo systemctl stop jupyterhub"
echo "  Restart: sudo systemctl restart jupyterhub"
echo "  Status:  sudo systemctl status jupyterhub"
echo "  Logs:    sudo journalctl -u jupyterhub -f"
echo ""
print_warning "Don't forget to:"
echo "  1. Create an admin user account"
echo "  2. Test the extension functionality"
echo "  3. Configure firewall rules if needed"
echo "  4. Set up regular backups"
echo ""

print_success "Setup complete! 🚀"
