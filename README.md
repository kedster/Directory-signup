# Directory-signup

Automate SaaS listing directory signups using Puppeteer and Apify. This Apify Actor helps you submit your product to multiple directory websites efficiently, with a management GUI for orchestration and control.

## Features

- 🚀 Process 50 directory sites automatically
- 🎨 **Management GUI** for visual control and orchestration
- 🔌 **Plugin system** for site-specific customization
- 🔄 Concurrent processing (5 sites at a time)
- 📸 Automatic screenshot capture on failures
- 📄 HTML snapshot saving for debugging
- 🎯 Site-specific selector overrides
- 📊 Detailed reporting and results tracking
- 🤖 Apify platform integration for scalable automation
- ⚙️ **Cloudflare Worker API** for automated GitHub commits (optional)

## New: Management GUI & Orchestration

This project now includes a comprehensive management system:

- **Visual Dashboard**: Manage all directory sites from a web interface
- **Plugin Architecture**: Modular system for custom site handling
- **Dynamic Configuration**: Enable/disable sites, assign plugins, add notes
- **Cloudflare Pages Compatible**: Deploy GUI as static site
- **Optional Worker API**: Automated GitHub commits and Apify triggering

See [MANAGEMENT_GUI.md](./MANAGEMENT_GUI.md) for complete documentation.

## 📚 Documentation

- **[Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)** - Deploy the Worker API to Cloudflare
- **[Apify Workflow Guide](./APIFY_WORKFLOW.md)** - Set up and test the Apify automation workflow
- **[Management GUI Documentation](./MANAGEMENT_GUI.md)** - Use the visual dashboard
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Technical architecture details

## Apify Actor Structure

This project follows Apify's recommended structure for Node.js actors:

```
/auto-directory-signup/
├── main.js                ← Entry point (wrapped in Apify.main())
├── plugin-registry.js     ← Plugin loader and manager
├── package.json           ← Dependencies & ES module config
├── apify.json             ← Apify actor configuration
├── sites.json             ← Directory sites configuration (enhanced)
├── overrides.json         ← Site-specific selectors
├── test.js                ← Test suite
├── plugins/               ← Modular plugin system
│   ├── default.js         ← Standard form-filling flow
│   ├── producthunt.js     ← ProductHunt-specific plugin
│   └── betalist.js        ← BetaList-specific plugin
├── gui/                   ← Management GUI
│   └── index.html         ← Single-page management interface
├── worker/                ← Cloudflare Worker API (optional)
│   ├── index.js           ← API endpoints
│   └── wrangler.toml      ← Worker configuration
├── README.md              ← This file
├── CLOUDFLARE_DEPLOYMENT.md ← Cloudflare Worker deployment guide
├── APIFY_WORKFLOW.md      ← Apify workflow setup guide
└── MANAGEMENT_GUI.md      ← GUI & orchestration documentation
```

## Quick Start

### 🚀 For Apify Platform

1. **[Set up on Apify](./APIFY_WORKFLOW.md#apify-platform-setup)** - Create actor from GitHub
2. **[Configure input](./APIFY_WORKFLOW.md#input-configuration)** - Add your product details
3. **[Run workflow](./APIFY_WORKFLOW.md#running-the-workflow)** - Start automation
4. **[View results](./APIFY_WORKFLOW.md#monitoring--results)** - Check success/failures

### ⚙️ For Cloudflare Workers

1. **[Install Wrangler CLI](./CLOUDFLARE_DEPLOYMENT.md#prerequisites)** - Set up tools
2. **[Configure secrets](./CLOUDFLARE_DEPLOYMENT.md#configuration)** - Add GitHub token
3. **[Deploy worker](./CLOUDFLARE_DEPLOYMENT.md#deployment)** - Push to Cloudflare
4. **[Test API](./CLOUDFLARE_DEPLOYMENT.md#testing)** - Verify endpoints

### 🎨 For Local Development

See [Installation](#installation) and [Usage](#usage) sections below.

---

## Installation

```bash
npm install
```

## Usage

### Running Locally

1. **First Run** - The script will process all sites and identify which ones need custom selectors:

```bash
npm start
```

### Running on Apify Platform

When deployed to Apify, the actor accepts input in the following format:

```json
{
  "listings": [
    {
      "name": "Your Startup Name",
      "email": "your@email.com",
      "website": "https://yourwebsite.com",
      "description": "Your product description"
    }
  ]
}
```

If no input is provided, the actor will use default test data.

### Processing Workflow

2. **Review Failures** - After the first run, check the generated folders:
   - `screenshots/` - Contains screenshots of each page
   - `html_snapshots/` - Contains HTML source of each page

3. **Add Overrides** - For each failed site, inspect the screenshot and HTML to find the correct selectors, then add them to `overrides.json`:

```json
{
  "producthunt.com": {
    "selectors": {
      "emailInput": "#email",
      "nameInput": "#product-name",
      "websiteInput": "#website",
      "descriptionInput": "#description",
      "submitButton": "button[type='submit']"
    },
    "waitForSelector": ".success-message",
    "customSteps": []
  }
}
```

4. **Run Again** - Process sites again with the new overrides:

```bash
npm start
```

## Configuration

### sites.json

Contains the list of directory sites to process. Each entry has:
- `name` - Display name of the directory
- `startUrl` - URL to the signup/submission page

### overrides.json

Contains site-specific configurations:
- `selectors` - CSS selectors for form fields (nameInput, emailInput, websiteInput, descriptionInput, submitButton)
- `waitForSelector` - Selector to wait for after submission
- `customSteps` - Array of custom actions (future feature)

### apify.json

Apify-specific configuration:
- `name` - Actor name
- `version` - Actor version
- `buildTag` - Docker build tag
- `env` - Environment variables

## Apify Integration

This actor is built with the Apify SDK and includes:

- **Apify.main()** - Entry point wrapper for proper Apify execution
- **Apify.getInput()** - Accepts listing data from Apify input
- **Apify.pushData()** - Pushes results to Apify dataset for later retrieval
- ES Module support for modern JavaScript features

## File Structure

```
.
├── main.js               # Main automation script (Apify entry point)
├── sites.json            # List of 50 directory sites
├── overrides.json        # Site-specific selector overrides
├── package.json          # Node.js dependencies (ES modules)
├── apify.json            # Apify configuration
├── test.js               # Test suite
├── screenshots/          # Generated screenshots (gitignored)
├── html_snapshots/       # Generated HTML files (gitignored)
└── results.json          # Detailed results log
```

## Process Flow

1. Actor accepts input listings from Apify (or uses defaults)
2. Loads sites from `sites.json`
3. Processes 5 sites concurrently
4. For each site and listing:
   - Navigates to the startUrl
   - Checks for site-specific overrides
   - If overrides exist, fills form with listing data
   - If no overrides, saves screenshot and HTML for inspection
5. Pushes results to Apify dataset
6. Generates summary report with:
   - Success count
   - Sites needing overrides
   - Failed sites with error details

## Expected Workflow

This tool is designed for iterative refinement:

1. **Initial Run**: Expect many failures - this is normal! The script will save screenshots and HTML for each failure.

2. **Inspection**: Open the saved screenshots and HTML files to understand each site's structure.

3. **Override Creation**: For each failed site, create an entry in `overrides.json` with exact selectors.

4. **Iteration**: Run the script again. Success rate will improve with each iteration.

5. **Repeat**: Continue until all sites are configured or you've covered your priority sites.

## Tips

- Start with 5-10 sites to test the process
- Use browser DevTools to find exact selectors
- Some sites may require login or have bot protection
- Consider adding delays or custom steps for complex forms
- Check `results.json` for detailed information about each run
- On Apify, results are automatically stored in the dataset

## Requirements

- Node.js 14+
- npm or yarn
- Apify SDK (included in dependencies)

## ES Module Notes

This project uses ES modules (`type: "module"` in package.json):
- Use `import` instead of `require()`
- Use `export` instead of `module.exports`
- JSON files are loaded using `fs.readFile()` and `JSON.parse()`

## License

MIT