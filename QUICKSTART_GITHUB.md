# Quick Start: Deploy from GitHub

## Step 1: Add GitHub Secrets (5 minutes)

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

### 1. CLOUDFLARE_API_TOKEN
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens
- Create token with "Edit Cloudflare Workers" + "Cloudflare Pages Edit" permissions
- Copy and save as this secret

### 2. CLOUDFLARE_ACCOUNT_ID
- Found in Cloudflare dashboard URL or sidebar
- Example: `https://dash.cloudflare.com/1234567890abcdef`
- Copy the hex ID and save as this secret

### 3. WORKER_GITHUB_TOKEN
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create classic token with `repo` scope (full control)
- Copy and save as this secret

## Step 2: Deploy (2 minutes)

Go to: **Actions tab in GitHub repository**

1. Click **Deploy Cloudflare Worker** → **Run workflow** → **Run workflow**
2. Wait 30-60 seconds for completion
3. Click **Deploy Cloudflare Pages** → **Run workflow** → **Run workflow**
4. Wait 30-60 seconds for completion

## Step 3: Verify (1 minute)

**Test Worker API:**
```bash
curl https://directory-signup-api.kedster.workers.dev/api
```

**Test GUI:**
Open browser: `https://directory-signup-gui.pages.dev`
- Should load 50 sites
- Check console: "✓ Loaded 50 sites from Worker API"

## Done! 🎉

Future changes to `worker/` or `gui/` folders will auto-deploy on push to main branch.

---

**Need help?** See `GITHUB_DEPLOYMENT.md` for detailed instructions.

**Troubleshooting?** See `DEPLOYMENT_TROUBLESHOOTING.md` for common issues.
