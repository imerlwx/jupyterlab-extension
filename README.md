# jlab_ext_example

[![Github Actions Status](https://github.com/imerlwx/jupyterlab-extension/workflows/Build/badge.svg)](https://github.com/imerlwx/jlab-ext-example/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/imerlwx/jlab-ext-example/main?urlpath=lab)
A JupyterLab extension that can be used to assist learning tutorial videos in programming.

This extension is composed of a Python package named `jlab_ext_example`
for the server extension and a NPM package named `jlab-ext-example`
for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

After git clone this repo, open this directory in any IDE.

```bash
git clone https://github.com/imerlwx/jupyterlab-ext
cd jupyterlab-ext/
```

Then set up a new vitual environment using conda and activate it.

```bash
conda create -n jupyterlab-ext --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=18 git copier=7 jinja2-time
conda activate jupyterlab-ext
```

For files in the src/ folder, if you see any Javascript dependencies that are not resolved, run one of the following commands to install them.

```bash
npm install
yarn
```

For files in the jlab_ext_example/ folder, if you see any Python dependencies that are not resolved, run the following command to install them.

```bash
pip install -r requirements.txt
```

Then you need to run the following commands one by one to see the extension in JupyterLab.

```bash
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jlab_ext_example
# Rebuild extension Typescript source after making changes
jlpm build
# Run JupyterLab
jupyter lab
```

## Deploy as Web Application

Want to share your extension with others without requiring installation? You can deploy it as a web application using JupyterHub!

### Quick Deploy

```bash
# On your cloud server (Ubuntu 22.04)
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/jupyterlab-extension.git
cd jupyterlab-extension/deployment
sudo bash setup.sh
```

The automated setup script will:
- Install JupyterHub and all dependencies
- Configure your extension to be available for all users
- Set up SSL with Let's Encrypt (if you have a domain)
- Configure authentication and user management

### Deployment Options

See the [deployment](./deployment/) directory for:
- **[DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md)** - Comprehensive step-by-step guide
- **[README.md](./deployment/README.md)** - Deployment files overview
- Configuration files for JupyterHub, nginx, and systemd
- Automated setup script

**Supported Cloud Providers:**
- DigitalOcean (recommended for beginners)
- AWS EC2
- Google Cloud Platform
- Any Ubuntu 22.04 server

**Estimated Cost:** $12-24/month for a 2-4 GB RAM server

After deployment, users can access your extension at your domain or server IP without any installation!

<!-- ## Uninstall

To remove the extension, execute:

```bash
pip uninstall jlab_ext_example
``` -->

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jlab_ext_example directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jlab_ext_example
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jlab_ext_example
pip uninstall jlab_ext_example
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jlab-ext-example` within that folder.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov jlab_ext_example
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
