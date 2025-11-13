# Management GUI & Orchestration System

This document describes the Management GUI and orchestration features for the Directory Signup automation system.

> **✅ IMPLEMENTATION STATUS**: The Management GUI and Cloudflare Worker API are now fully implemented with:
> - Multi-strategy site loading (Worker API → Relative Path → GitHub Raw)
> - Real GitHub API integration for fetching and committing sites.json
> - Visual notifications and error handling
> - "Save Changes" button to commit directly to GitHub
> 
> See [gui/README.md](./gui/README.md) for detailed usage instructions.

## Architecture Overview

```
+------------------+         +-------------------+         +------------------+
|                  |         |                   |         |                  |
|   Management GUI | <-----> | Cloudflare Worker | <-----> | GitHub Repo      |
|  (Cloudflare     |   API   |  (optional API &  |   Git   | /Directory-      |
|   Pages)         |         |  commits JSON)    |         | signup/          |
+------------------+         +-------------------+         +------------------+
                                                              |
                                                              v
                                                     +------------------+
                                                     | Apify Actor      |
                                                     | main.js          |
                                                     | plugins/*        |
                                                     | sites.json       |
                                                     +------------------+
```

## Components

### 1. Management GUI (`/gui`)

A single-page application that provides a visual interface to:
- View all directory sites and their configurations
- Enable/disable sites with toggle switches
- Edit site properties (plugin, notes, forceDefaultFlow)
- Filter and search sites
- Export/import site configurations
- Test individual sites

#### Features:
- **Dashboard Statistics**: Total sites, active sites, custom plugins, default flow sites
- **Site Cards**: Visual representation of each site with key information
- **Real-time Updates**: Instant feedback when toggling or editing sites
- **Search & Filter**: Find sites by name or domain, filter by status
- **Modal Editing**: Clean interface for editing site properties

#### Deployment:
The GUI is a static HTML file and can be deployed to:
- **Cloudflare Pages** (recommended)
- Any static hosting service (Netlify, Vercel, GitHub Pages)
- Local file system for development

To deploy to Cloudflare Pages:
```bash
cd gui
# Cloudflare Pages will automatically deploy index.html
```

### 2. Plugin System (`/plugins`)

A modular architecture that allows custom processing logic for different sites.

#### Available Plugins:

##### Default Plugin (`plugins/default.js`)
- Standard form-filling flow for most directory sites
- Tries multiple common selectors for each field
- Safe mode: doesn't submit forms by default
- Handles: email, name, website, description fields

##### ProductHunt Plugin (`plugins/producthunt.js`)
- Custom flow for Product Hunt submissions
- Handles: name, tagline, website, description, category
- Checks for authentication requirements
- Validates form before submission

##### BetaList Plugin (`plugins/betalist.js`)
- Custom flow for BetaList submissions
- Handles: startup name, URL, tagline, pitch, email, Twitter
- Optimized for BetaList's form structure

#### Creating New Plugins:

For detailed instructions on creating custom plugins, see the **[Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)**.

Quick example - create a new file in `/plugins/your-plugin.js`:

```javascript
export default class YourPlugin {
  constructor() {
    this.name = 'your-plugin';
  }

  async process(page, site, listing, overrides = {}) {
    console.log(`[${this.name}] Processing ${site.name}`);
    
    try {
      // Your custom logic here
      
      return {
        status: 'success',
        message: 'Processed successfully',
        plugin: this.name
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        plugin: this.name
      };
    }
  }
}
```

For complete documentation including CAPTCHA integration, testing, and best practices, refer to the [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md).

### 3. Plugin Registry (`plugin-registry.js`)

Central registry that:
- Loads all plugins from the `/plugins` directory
- Manages plugin instances
- Routes sites to appropriate plugins based on configuration
- Handles fallback to default plugin

### 4. Enhanced sites.json

New schema with GUI control fields:

```json
{
  "sites": [
    {
      "domain": "producthunt.com",
      "url": "https://www.producthunt.com/posts/new",
      "name": "ProductHunt",
      "plugin": "producthunt",
      "active": true,
      "forceDefaultFlow": false,
      "notes": "Requires manual review if submission fails"
    }
  ]
}
```

#### Fields:
- `domain`: Domain name (extracted from URL)
- `url`: Submission page URL
- `name`: Display name
- `plugin`: Plugin to use for this site (default: "default")
- `active`: Whether to process this site (default: true)
- `forceDefaultFlow`: Force use of default plugin (default: false)
- `notes`: Special instructions or notes

### 5. Cloudflare Worker API (`/worker`)

Optional API layer for advanced features:

#### Endpoints:

- `GET /api/sites` - Get all sites configuration
- `PUT /api/sites` - Update sites configuration
- `PUT /api/sites/:id` - Update a specific site
- `GET /api/plugins` - List available plugins
- `POST /api/run` - Trigger Apify actor run

#### Setup:

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Configure secrets:
```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put APIFY_API_TOKEN
```

3. Deploy:
```bash
cd worker
wrangler deploy
```

## Usage Workflows

### Workflow 1: GUI-Only Management

1. Open `gui/index.html` in a browser
2. View and manage site configurations
3. Export modified configuration
4. Manually commit `sites.json` to GitHub
5. Apify actor pulls latest configuration on next run

### Workflow 2: GUI + Worker API

1. Deploy Cloudflare Worker
2. Configure GUI to use Worker API endpoint
3. Make changes in GUI
4. GUI calls Worker API
5. Worker commits changes to GitHub
6. Apify actor pulls latest configuration

### Workflow 3: Direct Apify Management

1. Edit `sites.json` directly in repository
2. Commit changes
3. Run Apify actor
4. Actor dynamically loads plugins per site configuration

## Configuration Examples

### Enable/Disable Sites

```json
{
  "domain": "example.com",
  "active": false  // Site will be skipped
}
```

### Use Custom Plugin

```json
{
  "domain": "producthunt.com",
  "plugin": "producthunt",  // Uses ProductHunt plugin
  "forceDefaultFlow": false
}
```

### Force Default Plugin

```json
{
  "domain": "g2.com",
  "plugin": "custom-g2",
  "forceDefaultFlow": true  // Ignores plugin, uses default
}
```

## Plugin Status Codes

Plugins return status objects with:

- `status: 'success'` - Site processed successfully
- `status: 'needs_override'` - Site needs custom selectors
- `status: 'needs_auth'` - Site requires authentication
- `status: 'error'` - Processing error occurred
- `status: 'validation_failed'` - Form validation failed
- `status: 'skipped'` - Site is inactive

## Testing

### Test Plugin System

```bash
npm test
```

### Test Individual Site

Use the GUI "Test" button or run manually:

```bash
node -e "
import('./main.js').then(async () => {
  // Will test with default listing data
});
"
```

## Security Considerations

1. **API Authentication**: Worker API should validate requests
2. **GitHub Tokens**: Store in Cloudflare secrets, not in code
3. **Rate Limiting**: Implement rate limits on Worker endpoints
4. **Input Validation**: Validate all GUI inputs before committing
5. **CORS**: Configure appropriate CORS policies

## Deployment Checklist

- [ ] Update `sites.json` with new schema
- [ ] Test plugins locally
- [ ] Deploy GUI to Cloudflare Pages
- [ ] (Optional) Deploy Worker API
- [ ] Configure secrets (GitHub token, Apify token)
- [ ] Update Apify actor configuration
- [ ] Test end-to-end workflow

## Troubleshooting

### Plugins Not Loading

Check that:
- Plugin files are in `/plugins` directory
- Files end with `.js`
- Files export a default class
- Class has a `process()` method

### GUI Can't Load Sites

- Ensure `sites.json` is accessible from GUI location
- Check browser console for CORS errors
- Verify JSON syntax is valid

### Worker API Errors

- Check Wrangler logs: `wrangler tail`
- Verify secrets are configured
- Check CORS headers in responses

## Future Enhancements

- OAuth integration for sites requiring authentication
- Scheduled runs via Worker Cron
- Real-time status updates via WebSockets
- Plugin marketplace for community plugins
- A/B testing for different submission strategies
- Analytics dashboard for success rates
