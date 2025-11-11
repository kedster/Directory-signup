# GitHub Actions Deployment Setup

This document explains how to set up automated deployments from GitHub Actions for both the Cloudflare Worker API and Cloudflare Pages GUI.

## Overview

This repository now includes GitHub Actions workflows that automatically deploy:
1. **Cloudflare Worker** (API) - when changes are pushed to `worker/` folder
2. **Cloudflare Pages** (GUI) - when changes are pushed to `gui/` folder
3. **Sites.json Sync** - when `sites.json` is updated in the main branch

## Required GitHub Secrets

To enable automated deployments, you need to configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Add Required Secrets

#### For Cloudflare Worker & Pages Deployment

**`CLOUDFLARE_API_TOKEN`** (Required)
- **Description:** API token for deploying to Cloudflare
- **How to get it:**
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
  2. Go to **My Profile** → **API Tokens**
  3. Click **Create Token**
  4. Use the **Edit Cloudflare Workers** template
  5. Add **Cloudflare Pages** permissions:
     - Account Settings: Read
     - Cloudflare Pages: Edit
  6. Click **Continue to summary** → **Create Token**
  7. Copy the token and save it as this secret

**`CLOUDFLARE_ACCOUNT_ID`** (Required)
- **Description:** Your Cloudflare account ID
- **How to get it:**
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
  2. Go to **Workers & Pages** or any domain
  3. Look at the URL or right sidebar - Account ID is shown
  4. Example: `https://dash.cloudflare.com/1234567890abcdef` → `1234567890abcdef`
  5. Copy and save it as this secret

**`WORKER_GITHUB_TOKEN`** (Required for Worker API)
- **Description:** GitHub Personal Access Token for the Worker to commit sites.json changes
- **How to get it:**
  1. Go to GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
  2. Click **Generate new token (classic)**
  3. Give it a descriptive name: "Directory Signup Worker API"
  4. Select scopes:
     - ✅ `repo` (Full control of private repositories)
  5. Click **Generate token**
  6. Copy the token and save it as this secret
  7. **Important:** This is different from `GITHUB_TOKEN` which is automatically provided by GitHub Actions

## Workflow Files

### 1. Deploy Worker (`deploy-worker.yml`)
**Triggers:**
- Push to `main` branch with changes in `worker/` folder
- Manual trigger via GitHub Actions UI

**What it does:**
- Deploys the Worker API to Cloudflare Workers
- Sets up the `GITHUB_TOKEN` secret in the Worker environment
- Deploys to: `https://directory-signup-api.{your-subdomain}.workers.dev`

### 2. Deploy Pages (`deploy-pages.yml`)
**Triggers:**
- Push to `main` branch with changes in `gui/` folder
- Manual trigger via GitHub Actions UI

**What it does:**
- Deploys the GUI to Cloudflare Pages
- Creates/updates the Pages project named `directory-signup-gui`
- Deploys to: `https://directory-signup-gui.pages.dev`

### 3. Sync Sites (`sync-sites.yml`)
**Triggers:**
- Push to `main` branch with changes to `sites.json`
- Manual trigger via GitHub Actions UI

**What it does:**
- Copies `sites.json` to `gui/sites.json`
- Commits the change if files differ
- Ensures GUI has the latest site configuration

## Setup Steps

### Step 1: Add GitHub Secrets (Required)

Add these three secrets as described above:
1. `CLOUDFLARE_API_TOKEN`
2. `CLOUDFLARE_ACCOUNT_ID`
3. `WORKER_GITHUB_TOKEN`

### Step 2: Initial Deployment

After adding the secrets, trigger the workflows manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy Cloudflare Worker** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for completion (usually 30-60 seconds)
5. Repeat for **Deploy Cloudflare Pages** workflow

### Step 3: Verify Deployment

**Check Worker API:**
```bash
curl https://directory-signup-api.kedster.workers.dev/api
```

Expected response:
```json
{
  "name": "Directory Signup Management API",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/sites": "Get all sites configuration",
    ...
  }
}
```

**Check Pages GUI:**
1. Open `https://directory-signup-gui.pages.dev` in browser
2. Check browser console for loading messages
3. Should see: "✓ Loaded 50 sites from Worker API" or "Same Directory"

### Step 4: Update GUI Configuration (Optional)

If your Worker is deployed to a custom subdomain, update `gui/index.html`:

Find this line (around line 548):
```javascript
const API_BASE_URL = window.API_BASE_URL || 'https://directory-signup-api.kedster.workers.dev';
```

Change to your actual Worker URL:
```javascript
const API_BASE_URL = window.API_BASE_URL || 'https://directory-signup-api.YOUR-SUBDOMAIN.workers.dev';
```

Commit and push the change - Pages will auto-deploy.

## Manual Deployment (Alternative)

If you prefer manual deployment or need to debug:

### Deploy Worker Manually
```bash
cd worker
npm install -g wrangler
wrangler login
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

### Deploy Pages Manually
```bash
cd gui
npx wrangler pages deploy . --project-name=directory-signup-gui
```

## Troubleshooting

### Worker Deployment Fails

**Error: "Authentication error"**
- Check that `CLOUDFLARE_API_TOKEN` is set correctly
- Verify token has Worker edit permissions

**Error: "Account ID not found"**
- Check that `CLOUDFLARE_ACCOUNT_ID` is correct
- Get it from Cloudflare dashboard URL

### Pages Deployment Fails

**Error: "Project not found"**
- First deployment creates the project automatically
- Project name: `directory-signup-gui`
- Check Cloudflare dashboard → Workers & Pages

**Error: "API token invalid"**
- Token needs both Workers and Pages permissions
- Recreate token with correct permissions

### Worker API Not Working

**Sites.json not loading from Worker API:**
1. Check Worker is deployed: Visit `/api` endpoint
2. Verify `WORKER_GITHUB_TOKEN` secret is set in Worker
3. Check Worker logs: `wrangler tail` or Cloudflare dashboard
4. Verify `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` in `wrangler.toml`

### GUI Not Loading Sites

**If Worker API works but GUI shows 0 sites:**
1. Check browser console for errors
2. Verify Worker URL in `gui/index.html` matches your deployment
3. Check CORS errors (Worker already includes CORS headers)
4. GUI should fallback to loading `./sites.json` if Worker fails

**If all loading strategies fail:**
1. Ensure `gui/sites.json` exists and is valid JSON
2. Run `npm run sync-sites` to sync files
3. Check deployment logs in GitHub Actions
4. See `DEPLOYMENT_TROUBLESHOOTING.md` for detailed guide

## Workflow Logs

To view deployment logs:
1. Go to **Actions** tab in GitHub
2. Click on a workflow run
3. Click on the job name to see detailed logs
4. Check for errors or warnings

## Auto-Deployment Behavior

### On Main Branch Push:
- Changes to `worker/` → Deploys Worker
- Changes to `gui/` → Deploys Pages
- Changes to `sites.json` → Syncs to gui folder, which triggers Pages deploy

### Manual Trigger:
- Any workflow can be triggered manually via Actions UI
- Useful for:
  - Initial deployment
  - Redeploying after secret changes
  - Debugging deployment issues

## Security Notes

- **Never commit secrets** to the repository
- All secrets are stored securely in GitHub
- `GITHUB_TOKEN` (auto-provided) has limited repo access
- `WORKER_GITHUB_TOKEN` needs full repo access for commits
- Worker secrets are set during deployment and not exposed
- API tokens should be rotated regularly (every 90 days recommended)

## Next Steps After Setup

1. ✅ Add all required GitHub secrets
2. ✅ Manually trigger Worker deployment
3. ✅ Manually trigger Pages deployment  
4. ✅ Verify both deployments work
5. ✅ Test GUI loads sites correctly
6. ✅ Test Worker API endpoints
7. ✅ Make a test change to trigger auto-deployment
8. ✅ Monitor workflow runs for success

## Getting Help

If you encounter issues:

1. **Check workflow logs** in GitHub Actions
2. **Check Cloudflare dashboard** for deployment status
3. **Review troubleshooting** sections in this document
4. **See detailed guides:**
   - `CLOUDFLARE_DEPLOYMENT.md` - Worker manual deployment
   - `DEPLOYMENT_TROUBLESHOOTING.md` - GUI issues
   - `FIX_SUMMARY.md` - Architecture overview

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
