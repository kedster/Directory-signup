# Management GUI

This is the visual management interface for the Directory Signup automation system.

## Features

- 📊 View all directory sites with statistics
- ✏️ Edit site configurations (name, URL, plugin, notes)
- 🔄 Toggle sites active/inactive
- 🔍 Search and filter sites
- 💾 Save changes directly to GitHub repository
- 📥 Export/Import configurations

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

1. Push this repository to GitHub
2. In Cloudflare dashboard, go to Pages
3. Connect your GitHub repository
4. Set build directory to `gui`
5. Deploy!

Your GUI will be available at: `https://your-project.pages.dev`

### Option 2: Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# From the repository root
python3 -m http.server 8080
```

Then visit: `http://localhost:8080/gui/index.html`

### Option 3: Static Hosting

Deploy the `gui` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- etc.

## Configuration

The GUI uses a multi-strategy approach to load sites.json:

1. **Cloudflare Worker API** (primary) - Fetches from GitHub via Worker
2. **Same Directory** (fallback) - Loads `./sites.json` from the gui folder (for Cloudflare Pages deployment)
3. **Parent Directory** (fallback) - Loads `../sites.json` from parent folder (for local development)
4. **GitHub Raw URL** (last resort) - Direct fetch from GitHub

**Note**: The `gui` folder contains its own copy of `sites.json` to ensure it works when deployed as a standalone static site. If you update the main `sites.json` in the repository root, make sure to also copy it to `gui/sites.json` for deployment.

### Using the Cloudflare Worker API

To enable full functionality (save changes to GitHub), deploy the Cloudflare Worker:

```bash
cd worker
wrangler login
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

Then configure the GUI to use your Worker URL by setting `window.API_BASE_URL`:

```html
<script>
  window.API_BASE_URL = 'https://your-worker.workers.dev';
</script>
```

Or modify line ~522 in `index.html`:

```javascript
const API_BASE_URL = window.API_BASE_URL || 'https://directory-signup-api.kedster.workers.dev';
```

## Usage

### Viewing Sites

The dashboard shows:
- Total sites count
- Active sites count
- Sites using custom plugins
- Sites using default flow

### Editing a Site

1. Click the "✏️ Edit" button on any site card
2. Modify the fields:
   - **Name**: Display name
   - **URL**: Submission page URL
   - **Plugin**: Processing plugin (default, producthunt, betalist)
   - **Active**: Whether to process this site
   - **Force Default Flow**: Override plugin with default behavior
   - **Notes**: Special instructions
3. Click "Save Changes" button
4. Click "💾 Save Changes" in the toolbar to commit to GitHub

### Toggling Sites

Click the toggle switch on any site card to activate/deactivate it.

### Searching and Filtering

- Use the search box to find sites by name or domain
- Use filter buttons to show:
  - All Sites
  - Active Only
  - Inactive Only

### Exporting Configuration

Click "📥 Export Config" to download the current configuration as JSON.

### Importing Configuration

Click "📤 Import Config" to upload a previously exported configuration.

## Troubleshooting

### Sites Not Loading

**IMPORTANT:** If sites are not showing in production, see [DEPLOYMENT_TROUBLESHOOTING.md](../DEPLOYMENT_TROUBLESHOOTING.md) for a comprehensive troubleshooting guide.

Check the browser console for errors. The GUI tries four methods to load sites:

1. Worker API
2. Same directory (`./sites.json`)
3. Parent directory (`../sites.json`)
4. GitHub raw URL

If all fail, you'll see an error message.

**Quick Solutions:**
- Ensure `sites.json` exists in both the repository root and the `gui` folder
- Run `npm run sync-sites` from the repository root to sync the files
- Check that Cloudflare Worker is deployed and accessible (optional)
- Verify CORS settings if using Worker API
- Try opening `index.html` from a local server instead of file://
- When deploying to static hosting, ensure the entire `gui` folder (including `sites.json`) is deployed

### Cannot Save Changes

The "Save Changes" feature requires:
- Cloudflare Worker deployed
- `GITHUB_TOKEN` secret configured in Worker
- Token has `repo` scope permissions

If Worker is not set up, you can still:
- Export the configuration
- Manually edit `sites.json` in the repository
- Commit changes via Git

### CORS Errors

If you see CORS errors in console:
- Verify Worker is deployed with correct CORS headers
- Check that `API_BASE_URL` points to the correct Worker URL
- Ensure browser allows cross-origin requests

## Development

To modify the GUI:

1. Edit `index.html` directly (it's a single-page application)
2. Test locally with a web server
3. Commit changes to Git
4. Redeploy to hosting service

The GUI is intentionally a single HTML file for easy deployment and maintenance.

## Security Notes

- The GUI itself contains no secrets
- GitHub token is stored securely in Cloudflare Worker
- All API calls use HTTPS
- CORS is configured to allow all origins (can be restricted in Worker)

## Next Steps

- Deploy the Cloudflare Worker for full functionality
- Configure GitHub token in Worker secrets
- Deploy GUI to Cloudflare Pages or your preferred hosting
- Start managing your directory submissions!

For more information, see:
- [MANAGEMENT_GUI.md](../MANAGEMENT_GUI.md) - Full documentation
- [CLOUDFLARE_DEPLOYMENT.md](../CLOUDFLARE_DEPLOYMENT.md) - Worker deployment guide
- [README.md](../README.md) - Project overview
