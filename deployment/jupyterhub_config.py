# JupyterHub Configuration File
# This configuration is for deploying your JupyterLab extension with JupyterHub

import os
import sys

#------------------------------------------------------------------------------
# Application configuration
#------------------------------------------------------------------------------

# The public facing URL of the whole JupyterHub application
# Set this to your domain or IP address
c.JupyterHub.bind_url = 'http://0.0.0.0:8000'

# The base URL of the entire application
c.JupyterHub.base_url = '/'

#------------------------------------------------------------------------------
# Spawner configuration
#------------------------------------------------------------------------------

# Spawn JupyterLab by default (not classic Notebook)
c.Spawner.cmd = ['jupyter-labhub']

# Default URL to redirect users to after login
c.Spawner.default_url = '/lab'

# Ensure your extension is available in user environments
# This loads environment variables that include API keys
c.Spawner.environment = {
    'OPENAI_API_KEY': os.environ.get('OPENAI_API_KEY', ''),
    'YOUTUBE_API_KEY': os.environ.get('YOUTUBE_API_KEY', ''),
}

# Set the working directory for user notebooks
# Each user will have their own home directory
c.Spawner.notebook_dir = '~/notebooks'

# Memory limit per user (in GB) - adjust based on your VM size
# For a 4 GB VM with ~3 users, set this to 1G per user
c.Spawner.mem_limit = '1G'

# CPU limit per user (1.0 = 1 full CPU core)
c.Spawner.cpu_limit = 1.0

# Timeout for notebook server to start (seconds)
c.Spawner.start_timeout = 120

# Timeout for HTTP requests to the notebook server (seconds)
c.Spawner.http_timeout = 60

#------------------------------------------------------------------------------
# Authenticator configuration
#------------------------------------------------------------------------------

# Option 1: Native Authenticator (allows user registration)
# Uncomment these lines to enable user self-registration:

from nativeauthenticator import NativeAuthenticator
c.JupyterHub.authenticator_class = NativeAuthenticator

# Allow users to sign up
c.NativeAuthenticator.open_signup = True

# Require admin approval for new users (set to False for automatic approval)
c.NativeAuthenticator.ask_email_on_signup = True

# Minimum password length
c.NativeAuthenticator.minimum_password_length = 8

# Check for common passwords
c.NativeAuthenticator.check_common_password = True


# Option 2: GitHub OAuth (alternative - comment out Native Authenticator if using this)
# Uncomment and configure these lines to use GitHub OAuth:
#
# from oauthenticator.github import GitHubOAuthenticator
# c.JupyterHub.authenticator_class = GitHubOAuthenticator
# c.GitHubOAuthenticator.oauth_callback_url = 'https://your-domain.com/hub/oauth_callback'
# c.GitHubOAuthenticator.client_id = 'your-github-client-id'
# c.GitHubOAuthenticator.client_secret = 'your-github-client-secret'


# Option 3: Google OAuth (alternative - comment out Native Authenticator if using this)
# Uncomment and configure these lines to use Google OAuth:
#
# from oauthenticator.google import GoogleOAuthenticator
# c.JupyterHub.authenticator_class = GoogleOAuthenticator
# c.GoogleOAuthenticator.oauth_callback_url = 'https://your-domain.com/hub/oauth_callback'
# c.GoogleOAuthenticator.client_id = 'your-google-client-id.apps.googleusercontent.com'
# c.GoogleOAuthenticator.client_secret = 'your-google-client-secret'
# c.GoogleOAuthenticator.hosted_domain = ['your-domain.com']  # Optional: restrict to your domain
# c.GoogleOAuthenticator.login_service = 'Google'


#------------------------------------------------------------------------------
# Admin users
#------------------------------------------------------------------------------

# Set of usernames that should have admin privileges
# Admins can access the admin panel at /hub/admin
c.Authenticator.admin_users = {'admin', 'jupyterhub-admin'}

# Allow admins to access user notebooks
c.JupyterHub.admin_access = True

#------------------------------------------------------------------------------
# Security
#------------------------------------------------------------------------------

# Cookie secret file location
c.JupyterHub.cookie_secret_file = '/srv/jupyterhub/jupyterhub_cookie_secret'

# Database file location (SQLite)
c.JupyterHub.db_url = 'sqlite:////srv/jupyterhub/jupyterhub.sqlite'

# Shutdown servers after inactivity (seconds)
# Saves resources when users are inactive
c.JupyterHub.services = []

# Cull idle servers after 1 hour of inactivity
c.JupyterHub.load_roles = [
    {
        "name": "server-culler",
        "scopes": [
            "list:users",
            "read:users:activity",
            "read:servers",
            "delete:servers",
        ],
        # The cull idle service automatically shuts down idle servers
        "services": ["idle-culler"],
    }
]

c.JupyterHub.services = [
    {
        "name": "idle-culler",
        "command": [
            sys.executable,
            "-m", "jupyterhub_idle_culler",
            "--timeout=3600",  # Cull after 1 hour (3600 seconds)
        ],
    }
]

#------------------------------------------------------------------------------
# Logging
#------------------------------------------------------------------------------

# Log level
c.JupyterHub.log_level = 'INFO'

# Log file location
c.JupyterHub.extra_log_file = '/var/log/jupyterhub/jupyterhub.log'

# Log all HTTP requests
c.JupyterHub.log_datefmt = '%Y-%m-%d %H:%M:%S'
c.JupyterHub.log_format = '%(color)s[%(levelname)1.1s %(asctime)s.%(msecs).03d %(name)s %(module)s:%(lineno)d]%(end_color)s %(message)s'

#------------------------------------------------------------------------------
# Proxy configuration
#------------------------------------------------------------------------------

# The proxy is used to route traffic to user notebook servers
c.ConfigurableHTTPProxy.should_start = True
c.ConfigurableHTTPProxy.auth_token = os.environ.get('CONFIGPROXY_AUTH_TOKEN', '')

#------------------------------------------------------------------------------
# User management
#------------------------------------------------------------------------------

# Allow named servers (each user can have multiple servers)
c.JupyterHub.allow_named_servers = False

# Maximum number of concurrent servers that can be active per user
c.JupyterHub.named_server_limit_per_user = 1

# Maximum number of concurrent server spawns
c.JupyterHub.concurrent_spawn_limit = 10

#------------------------------------------------------------------------------
# Paths and templates
#------------------------------------------------------------------------------

# Path to PID file for the hub process
c.JupyterHub.pid_file = '/var/run/jupyterhub.pid'

# Custom logo (optional - uncomment and set path if you have a custom logo)
# c.JupyterHub.logo_file = '/path/to/your/logo.png'

#------------------------------------------------------------------------------
# Extension-specific configuration
#------------------------------------------------------------------------------

# Pre-install your extension in all user environments
# This is handled by installing the extension system-wide with pip
# No additional configuration needed here

# Ensure users can access the extension's server endpoints
c.ServerApp.allow_origin = '*'
c.ServerApp.disable_check_xsrf = False

#------------------------------------------------------------------------------
# Performance tuning
#------------------------------------------------------------------------------

# Number of threads for the proxy
c.ConfigurableHTTPProxy.api_url = 'http://127.0.0.1:8001'

# Heartbeat interval (seconds) - check if users are still active
c.JupyterHub.hub_connect_timeout = 30

# Increase if you have slow-starting servers
c.Spawner.http_timeout = 120

#------------------------------------------------------------------------------
# Networking
#------------------------------------------------------------------------------

# The IP address the proxy will listen on
c.JupyterHub.ip = '0.0.0.0'

# The port the proxy will listen on
c.JupyterHub.port = 8000

# The IP address the Hub will listen on (localhost is fine since nginx proxies)
c.JupyterHub.hub_ip = '127.0.0.1'

# The port the Hub will listen on
c.JupyterHub.hub_port = 8081

#------------------------------------------------------------------------------
# Customization (optional)
#------------------------------------------------------------------------------

# Custom HTML template (optional)
# You can create custom templates in /opt/jupyterhub/share/jupyterhub/templates/
# c.JupyterHub.template_paths = ['/path/to/custom/templates']

# Announcement message shown to all users (optional)
# c.JupyterHub.template_vars = {
#     'announcement': 'Welcome to the JupyterLab Extension Demo!',
# }

#------------------------------------------------------------------------------
# Debugging (uncomment for troubleshooting)
#------------------------------------------------------------------------------

# c.JupyterHub.log_level = 'DEBUG'
# c.Spawner.debug = True
# c.ConfigurableHTTPProxy.debug = True
