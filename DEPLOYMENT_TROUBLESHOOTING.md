# GUI Deployment Troubleshooting Guide

This guide helps you resolve issues with the Management GUI not showing sites in production.

## Common Issue: Sites Not Showing

**Symptom:** The GUI loads but shows "0 Total Sites" or displays an error message.

**Root Cause:** The GUI cannot load `sites.json` from any of its fallback sources.

## Loading Strategy

The GUI uses a multi-strategy fallback approach to load `sites.json`:

1. **Worker API** (optional) - `https://directory-signup-api.kedster.workers.dev/api/sites`
2. **Same Directory** - `./sites.json` (relative to GUI location)
3. **Parent Directory** - `../sites.json` (for local development)
4. **GitHub Raw** - `https://raw.githubusercontent.com/kedster/Directory-signup/main/sites.json`

## Quick Fix Checklist

- [ ] **Ensure `sites.json` exists in `gui/` folder**
  ```bash
  ls -la gui/sites.json
  ```

- [ ] **Verify `sites.json` is valid JSON**
  ```bash
  cat gui/sites.json | jq .
  ```

- [ ] **Sync `sites.json` if needed**
  ```bash
  npm run sync-sites
  # OR manually:
  cp sites.json gui/sites.json
  ```

- [ ] **Check browser console for errors**
  - Open DevTools (F12)
  - Look for fetch errors or JavaScript errors
  - Check which loading strategy succeeded

- [ ] **Deploy entire `gui/` folder**
  - Ensure your hosting service deploys ALL files in `gui/`
  - Including: `index.html`, `sites.json`, and `README.md`

## Deployment-Specific Solutions

### Cloudflare Pages

1. **Set Build Configuration:**
   - Build command: Leave empty (no build needed)
   - Build output directory: `gui`
   - Root directory: `/`

2. **Environment Variables:** None required

3. **Deploy Process:**
   ```bash
   # Commit changes
   git add gui/sites.json
   git commit -m "Sync sites.json for deployment"
   git push
   
   # Cloudflare Pages will auto-deploy
   ```

### GitHub Pages

1. **Enable GitHub Pages:**
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`
   - Folder: `/gui`

2. **Ensure sites.json is committed:**
   ```bash
   git add gui/sites.json
   git commit -m "Add sites.json to GUI folder"
   git push
   ```

3. **Access at:** `https://yourusername.github.io/Directory-signup/`

### Netlify

1. **Build Settings:**
   - Base directory: `gui`
   - Build command: (leave empty)
   - Publish directory: `.` (current directory, since we're already in gui)

2. **Deploy:**
   ```bash
   # Using Netlify CLI
   cd gui
   netlify deploy --prod
   ```

### Vercel

1. **Project Settings:**
   - Framework Preset: Other
   - Root Directory: `gui`
   - Build Command: (leave empty)
   - Output Directory: `.`

2. **Deploy:**
   ```bash
   # Using Vercel CLI
   vercel --prod
   ```

## Testing Locally

Before deploying, test locally to ensure everything works:

```bash
# Option 1: Using Python
cd gui
python3 -m http.server 8080
# Visit: http://localhost:8080/

# Option 2: Using Node.js
cd gui
npx http-server -p 8080
# Visit: http://localhost:8080/

# Option 3: Using PHP
cd gui
php -S localhost:8080
# Visit: http://localhost:8080/
```

Open the browser console (F12) and check for:
- "Strategy 2: Attempting to load sites from same directory..." message
- "✓ Successfully loaded from same directory" confirmation
- "Loaded X sites from Same Directory" notification

## Automated Syncing

A GitHub Actions workflow automatically syncs `sites.json` to `gui/sites.json` when you update the main file:

**File:** `.github/workflows/sync-sites.yml`

This ensures the GUI always has the latest sites configuration.

**Manual Trigger:**
1. Go to Actions tab in GitHub
2. Select "Sync sites.json to GUI" workflow
3. Click "Run workflow"

## Worker API Setup (Optional)

The Worker API is **optional**. The GUI works fine without it using fallback strategies.

If you want full functionality (save changes to GitHub):

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Deploy Worker:**
   ```bash
   cd worker
   wrangler login
   wrangler secret put GITHUB_TOKEN
   wrangler deploy
   ```

3. **Configure GUI:**
   Update line ~532 in `gui/index.html`:
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || 'https://your-worker.workers.dev';
   ```

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed Worker setup.

## Debugging Steps

### 1. Check Browser Console

Open DevTools (F12) → Console tab. Look for:

```
Strategy 1: Attempting to load sites from Worker API...
Worker API unavailable: Failed to fetch
Strategy 2: Attempting to load sites from same directory (./sites.json)...
Same directory response status: 200
✓ Successfully loaded from same directory
✓ Loaded 50 sites using Same Directory
```

### 2. Verify File Access

Test if `sites.json` is accessible:

```bash
# If deployed to example.com
curl https://example.com/sites.json

# Or for GitHub Pages
curl https://username.github.io/Directory-signup/sites.json
```

### 3. Check Network Tab

DevTools → Network tab:
- Look for failed requests
- Check response headers
- Verify CORS settings

### 4. Check JSON Structure

Ensure `sites.json` has the correct structure:

```json
{
  "sites": [
    {
      "domain": "example.com",
      "url": "https://example.com/submit",
      "name": "Example Directory",
      "plugin": "default",
      "active": true
    }
  ]
}
```

## Common Errors and Solutions

### Error: "Unable to load sites from any source"

**Cause:** All loading strategies failed.

**Solution:**
1. Verify `gui/sites.json` exists and is valid JSON
2. Check browser console for specific error messages
3. Ensure CORS is not blocking requests
4. Test locally first

### Error: "No sites found in configuration"

**Cause:** JSON structure is incorrect or empty.

**Solution:**
1. Check if JSON has `sites` array:
   ```json
   { "sites": [...] }
   ```
2. Ensure array is not empty
3. Validate JSON syntax

### Sites Load But Changes Don't Save

**Cause:** Worker API not configured or GitHub token missing.

**Solution:**
1. Either deploy the Worker with proper configuration
2. Or use Export/Import feature and commit manually:
   - Click "📥 Export Config"
   - Edit `sites.json` in repository
   - Commit and push changes
   - Reload GUI

## Production Checklist

Before going live:

- [ ] `sites.json` exists in both root and `gui/` folders
- [ ] Both files are identical (run `npm run sync-sites`)
- [ ] GitHub Actions workflow is enabled
- [ ] Tested locally and verified sites load
- [ ] Browser console shows no errors
- [ ] Deployment platform is configured correctly
- [ ] All files in `gui/` folder are deployed
- [ ] Optional: Worker API deployed if using save feature

## Getting Help

If sites still don't show:

1. **Check Console Logs:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Copy all error messages

2. **Verify Deployment:**
   - Visit your deployed URL
   - Add `/sites.json` to the URL
   - Confirm file is accessible

3. **Test Locally:**
   - Clone the repo fresh
   - Run local server
   - If it works locally but not in production, it's a deployment issue

4. **GitHub Issue:**
   - Open an issue with:
     - Deployment platform (Cloudflare Pages, Netlify, etc.)
     - Browser console logs
     - Network tab screenshots
     - Link to deployed site

## Additional Resources

- [Management GUI Documentation](./MANAGEMENT_GUI.md)
- [Cloudflare Worker Deployment](./CLOUDFLARE_DEPLOYMENT.md)
- [Main README](./README.md)
- [GUI Folder README](./gui/README.md)
