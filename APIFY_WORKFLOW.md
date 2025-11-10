# Apify Workflow Guide

This guide provides comprehensive instructions for setting up, testing, and running the Directory Signup automation workflow on the Apify platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Apify Platform Setup](#apify-platform-setup)
- [Actor Configuration](#actor-configuration)
- [Running the Workflow](#running-the-workflow)
- [Input Configuration](#input-configuration)
- [Testing](#testing)
- [Monitoring & Results](#monitoring--results)
- [Integration with Cloudflare](#integration-with-cloudflare)
- [Troubleshooting](#troubleshooting)
- [Advanced Workflows](#advanced-workflows)

---

## Overview

The Directory Signup Actor automates the submission of your product to 50+ directory websites using Puppeteer and the Apify platform.

### What It Does

- ✅ Automates form filling across directory sites
- ✅ Supports custom plugins for site-specific logic
- ✅ Captures screenshots and HTML snapshots on failures
- ✅ Processes sites concurrently (5 at a time)
- ✅ Provides detailed success/failure reporting
- ✅ Integrates with Management GUI for configuration

### Architecture Flow

```
Apify Actor Input
       ↓
Load sites.json & plugins
       ↓
Process Sites (5 concurrent)
       ↓
  ┌────┴────┐
  ↓         ↓
Success   Failure
  ↓         ↓
Results   Screenshots + HTML
       ↓
Apify Dataset (output)
```

---

## Prerequisites

### 1. Apify Account

- Sign up at [apify.com](https://apify.com)
- Free tier includes:
  - $5 free credits monthly
  - Sufficient for testing and small runs
  - No credit card required to start

### 2. Repository Access

- GitHub account with access to this repository
- Familiarity with Git basics

### 3. Product Information

Prepare your product details:
- Product name
- Email address
- Website URL
- Description (50-200 words)
- Category/tags (optional)
- Logo/images (optional)

---

## Apify Platform Setup

### Step 1: Create Actor

#### Option A: From GitHub (Recommended)

1. **Log in to Apify Console**
   - Go to [console.apify.com](https://console.apify.com)

2. **Create New Actor**
   - Click "Actors" in sidebar
   - Click "Create new"
   - Select "From GitHub repository"

3. **Connect Repository**
   ```
   Repository URL: https://github.com/kedster/Directory-signup
   Branch: main
   ```

4. **Configure Build**
   - Build tag: `latest`
   - Node.js version: `18` (or latest LTS)

5. **Click "Create"**

#### Option B: Upload Manually

1. **Zip Project Files**
   ```bash
   git clone https://github.com/kedster/Directory-signup.git
   cd Directory-signup
   zip -r directory-signup.zip . -x "*.git*" -x "node_modules/*" -x "screenshots/*" -x "html_snapshots/*"
   ```

2. **Upload to Apify**
   - Console → Actors → Create new
   - Select "Upload files"
   - Upload `directory-signup.zip`

### Step 2: Configure Actor Settings

Navigate to Actor → Settings:

#### Basic Settings

- **Name:** `auto-directory-signup`
- **Title:** `Directory Signup Automation`
- **Description:** `Automate SaaS listing directory signups`
- **Version:** `1.0.0`

#### Build Configuration

```json
{
  "dockerfile": "./Dockerfile",
  "tag": "latest"
}
```

If no Dockerfile exists, Apify uses default Node.js build.

#### Memory & Timeout

- **Memory:** 2048 MB (recommended for Puppeteer)
- **Timeout:** 300 seconds (5 minutes per run)
- **Build memory:** 2048 MB

#### Environment Variables

Add in Actor → Settings → Environment:

```
NODE_ENV=production
DEBUG=false
```

Optional (if using GitHub API):
```
GITHUB_TOKEN=your_github_token
```

---

## Actor Configuration

### Verify apify.json

Ensure `apify.json` is configured:

```json
{
  "name": "auto-directory-signup",
  "version": "1.0.0",
  "buildTag": "latest",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Configure sites.json

The actor uses `sites.json` to determine which directories to process:

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
      "notes": "Requires manual review"
    }
  ]
}
```

**Key fields:**
- `active`: Set to `false` to skip this site
- `plugin`: Which plugin to use (`default`, `producthunt`, `betalist`)
- `url`: The submission page URL

### Configure Plugins

Plugins are in `/plugins` directory:
- `default.js` - Standard form filling
- `producthunt.js` - ProductHunt-specific
- `betalist.js` - BetaList-specific

Add custom plugins as needed (see [MANAGEMENT_GUI.md](./MANAGEMENT_GUI.md)).

---

## Running the Workflow

### Method 1: Apify Console (Web UI)

1. **Navigate to Your Actor**
   - Console → Actors → auto-directory-signup

2. **Click "Start"**

3. **Configure Input** (optional)
   ```json
   {
     "listings": [
       {
         "name": "My Startup",
         "email": "contact@mystartup.com",
         "website": "https://mystartup.com",
         "description": "Revolutionary SaaS platform that helps businesses automate directory submissions"
       }
     ]
   }
   ```

4. **Run**
   - Click "Start" button
   - Monitor progress in real-time

### Method 2: Apify API

```bash
# Replace YOUR_API_TOKEN and YOUR_ACTOR_ID
curl -X POST https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listings": [{
      "name": "My Startup",
      "email": "contact@mystartup.com",
      "website": "https://mystartup.com",
      "description": "Revolutionary SaaS platform"
    }]
  }'
```

### Method 3: Apify CLI

1. **Install Apify CLI**
   ```bash
   npm install -g apify-cli
   ```

2. **Authenticate**
   ```bash
   apify login
   ```

3. **Run Actor**
   ```bash
   apify call YOUR_ACTOR_ID --input '{
     "listings": [{
       "name": "My Startup",
       "email": "contact@mystartup.com",
       "website": "https://mystartup.com",
       "description": "Revolutionary SaaS platform"
     }]
   }'
   ```

### Method 4: Schedule Runs

Set up recurring runs:

1. **Navigate to Schedules**
   - Console → Schedules → Create new

2. **Configure Schedule**
   - Name: `Weekly Directory Updates`
   - Cron expression: `0 9 * * 1` (Every Monday at 9 AM)
   - Actor: Select your actor
   - Input: Add your listing data

3. **Save**

---

## Input Configuration

### Input Schema

The actor accepts the following input format:

```json
{
  "listings": [
    {
      "name": "string (required)",
      "email": "string (required)",
      "website": "string (required)",
      "description": "string (required)",
      "category": "string (optional)",
      "tags": ["array", "of", "strings"] "(optional)",
      "twitter": "string (optional)",
      "logo": "string URL (optional)"
    }
  ],
  "options": {
    "concurrentLimit": 5,
    "timeout": 30000,
    "skipInactive": true,
    "saveScreenshots": true
  }
}
```

### Example Inputs

#### Minimal Input

```json
{
  "listings": [{
    "name": "My Startup",
    "email": "contact@mystartup.com",
    "website": "https://mystartup.com",
    "description": "A revolutionary SaaS platform"
  }]
}
```

#### Full Input

```json
{
  "listings": [{
    "name": "My Startup",
    "email": "contact@mystartup.com",
    "website": "https://mystartup.com",
    "description": "A revolutionary SaaS platform that helps businesses automate their directory submissions efficiently",
    "category": "SaaS Tools",
    "tags": ["automation", "marketing", "saas"],
    "twitter": "@mystartup",
    "logo": "https://mystartup.com/logo.png"
  }],
  "options": {
    "concurrentLimit": 5,
    "timeout": 30000,
    "skipInactive": true,
    "saveScreenshots": true
  }
}
```

#### Multiple Listings

```json
{
  "listings": [
    {
      "name": "Startup A",
      "email": "contact@startupa.com",
      "website": "https://startupa.com",
      "description": "First product description"
    },
    {
      "name": "Startup B",
      "email": "contact@startupb.com",
      "website": "https://startupb.com",
      "description": "Second product description"
    }
  ]
}
```

### Default Input

If no input is provided, the actor uses test data:

```json
{
  "listings": [{
    "name": "Test Startup",
    "email": "test@example.com",
    "website": "https://example.com",
    "description": "A test product for directory automation"
  }]
}
```

---

## Testing

### Test Workflow

#### 1. Test with Single Site

Modify `sites.json` to include only one test site:

```json
{
  "sites": [{
    "domain": "example.com",
    "url": "https://example.com/submit",
    "name": "Test Site",
    "plugin": "default",
    "active": true
  }]
}
```

#### 2. Test Run

Start actor with test input:

```json
{
  "listings": [{
    "name": "Test Product",
    "email": "test@example.com",
    "website": "https://testproduct.com",
    "description": "Testing the automation workflow"
  }]
}
```

#### 3. Verify Results

Check the Actor run results:
- Console → Actor runs → Select latest run
- Review logs for errors
- Check dataset for output data
- Download screenshots if failures occurred

### Local Testing

Test locally before deploying to Apify:

```bash
# Clone repository
git clone https://github.com/kedster/Directory-signup.git
cd Directory-signup

# Install dependencies
npm install

# Run locally
npm start
```

This runs the actor using local files, helpful for debugging.

---

## Monitoring & Results

### View Run Logs

1. **Navigate to Run**
   - Console → Actors → Your actor → Runs
   - Click on specific run

2. **View Log**
   - Real-time log output
   - Shows progress, errors, and results

**Example log:**
```
[ProductHunt] Starting signup process...
  URL: https://www.producthunt.com/posts/new
  Plugin: producthunt
  Active: true
✓ [ProductHunt] Success
  Duration: 12.3s
```

### Access Results

Results are stored in the Actor's dataset.

#### View in Console

1. **Navigate to Dataset**
   - Console → Storage → Datasets
   - Select dataset from your run

2. **View Data**
   - JSON format
   - CSV export available
   - API access available

#### Access via API

```bash
# Get dataset items
curl https://api.apify.com/v2/datasets/DATASET_ID/items \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Result Format

Each processed site produces a result object:

```json
{
  "site": "ProductHunt",
  "status": "success",
  "message": "Form submitted successfully",
  "plugin": "producthunt",
  "duration": 12345,
  "timestamp": "2024-01-15T10:30:00Z",
  "url": "https://www.producthunt.com/posts/new",
  "screenshot": null
}
```

**Status values:**
- `success` - Site processed successfully
- `error` - Processing error occurred
- `needs_override` - Site needs custom selectors
- `needs_auth` - Site requires authentication
- `skipped` - Site is inactive

### Download Screenshots

If failures occurred:

1. **Navigate to Key-Value Store**
   - Console → Storage → Key-value stores
   - Select store from your run

2. **Download Files**
   - Screenshots: `screenshots/SITENAME_TIMESTAMP.png`
   - HTML: `html_snapshots/SITENAME_TIMESTAMP.html`

### Summary Report

The actor generates a summary at the end:

```
=== Final Summary ===
Total sites: 50
Successful: 35
Failed: 10
Skipped: 5

Sites needing overrides:
- site1.com
- site2.com
```

---

## Integration with Cloudflare

### Trigger from Cloudflare Worker

The Cloudflare Worker can trigger Apify runs:

```javascript
// In worker/index.js
async function triggerApifyRun(request, env) {
  const { sites, listings } = await request.json();
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/${env.APIFY_ACTOR_ID}/runs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.APIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listings })
    }
  );
  
  return await response.json();
}
```

### Automated Workflow

1. **User updates sites in GUI**
2. **GUI calls Cloudflare Worker**
3. **Worker commits to GitHub**
4. **Worker triggers Apify run**
5. **Apify pulls latest sites.json**
6. **Apify processes sites**
7. **Results stored in dataset**

### Setup Integration

1. **Get Apify API Token**
   - Apify Console → Settings → Integrations → API tokens
   - Copy token

2. **Configure Worker**
   ```bash
   cd worker
   wrangler secret put APIFY_API_TOKEN
   # Paste token when prompted
   ```

3. **Add Actor ID to wrangler.toml**
   ```toml
   [vars]
   APIFY_ACTOR_ID = "YOUR_ACTOR_ID"
   ```

4. **Deploy Worker**
   ```bash
   wrangler deploy
   ```

5. **Test Integration**
   ```bash
   curl -X POST https://your-worker.workers.dev/api/run \
     -H "Content-Type: application/json" \
     -d '{"listings": [{"name": "Test", "email": "test@example.com", "website": "https://test.com", "description": "Test"}]}'
   ```

---

## Troubleshooting

### Common Issues

#### 1. Actor Build Fails

**Problem:** Build fails with dependency errors

**Solution:**
```bash
# Ensure package.json has correct dependencies
npm install
npm test  # Test locally first

# Check Node version
node --version  # Should be 18+
```

#### 2. Puppeteer Crashes

**Problem:** `Error: Failed to launch browser`

**Solution:**
- Increase memory: Actor Settings → Memory → 2048 MB
- Check timeout settings
- Verify Puppeteer version in package.json

#### 3. Sites Not Processing

**Problem:** All sites show "needs_override"

**Solution:**
- Check sites.json format
- Verify plugin assignments
- Review overrides.json for selectors
- Check site URLs are accessible

#### 4. No Results in Dataset

**Problem:** Dataset is empty after run

**Solution:**
- Check logs for errors
- Verify Apify.pushData() is called in main.js
- Ensure run completed successfully

#### 5. Authentication Required

**Problem:** Sites return "needs_auth" status

**Solution:**
- Some sites require login before submission
- Add authentication logic to custom plugin
- Consider manual submission for these sites

### Debug Mode

Enable detailed logging:

1. **Set Environment Variable**
   ```
   DEBUG=true
   ```

2. **Add Logging in Code**
   ```javascript
   console.log('Processing site:', site.name);
   console.log('Using plugin:', plugin.name);
   ```

3. **View Logs**
   - Console → Actor runs → Select run → Log

### Test Individual Sites

Create a test run for specific site:

```javascript
// test.js
import Apify from 'apify';
import { processSite } from './main.js';

Apify.main(async () => {
  const site = {
    name: 'ProductHunt',
    url: 'https://www.producthunt.com/posts/new',
    plugin: 'producthunt'
  };
  
  const listing = {
    name: 'Test Product',
    email: 'test@example.com',
    website: 'https://test.com',
    description: 'Test description'
  };
  
  const result = await processSite(site, {}, browser, listing);
  console.log('Result:', result);
});
```

---

## Advanced Workflows

### Webhook Integration

Set up webhooks to notify external services:

1. **Configure Webhook**
   - Actor Settings → Webhooks
   - Add URL: `https://your-endpoint.com/webhook`
   - Events: `ACTOR.RUN.SUCCEEDED`, `ACTOR.RUN.FAILED`

2. **Webhook Payload**
   ```json
   {
     "actorId": "...",
     "actorRunId": "...",
     "eventType": "ACTOR.RUN.SUCCEEDED",
     "eventData": {
       "actorRun": {...}
     }
   }
   ```

### Batch Processing

Process multiple products efficiently:

```json
{
  "listings": [
    {"name": "Product 1", "email": "p1@example.com", ...},
    {"name": "Product 2", "email": "p2@example.com", ...},
    {"name": "Product 3", "email": "p3@example.com", ...}
  ],
  "options": {
    "concurrentLimit": 3
  }
}
```

### Incremental Processing

Process only failed sites from previous run:

1. **Export Failed Sites**
   ```javascript
   const failedSites = results.filter(r => r.status === 'error');
   ```

2. **Update sites.json**
   - Set `active: false` for successful sites
   - Keep `active: true` for failed sites

3. **Re-run Actor**

### Custom Scheduling

Create complex schedules:

```javascript
// Monday & Thursday at 9 AM
0 9 * * 1,4

// Every 6 hours
0 */6 * * *

// First day of month at midnight
0 0 1 * *
```

---

## Performance Optimization

### Increase Concurrency

For faster processing (requires more memory):

```json
{
  "options": {
    "concurrentLimit": 10
  }
}
```

Memory recommendation:
- 5 concurrent: 2048 MB
- 10 concurrent: 4096 MB
- 20 concurrent: 8192 MB

### Reduce Timeout

For faster sites:

```json
{
  "options": {
    "timeout": 15000
  }
}
```

### Skip Screenshots

To save storage:

```json
{
  "options": {
    "saveScreenshots": false
  }
}
```

---

## Best Practices

1. **Test Locally First**
   - Run `npm start` before deploying
   - Verify plugins work correctly

2. **Start Small**
   - Test with 5-10 sites initially
   - Expand after verifying success

3. **Monitor Costs**
   - Check usage in Console → Billing
   - Free tier: $5/month credit
   - Costs based on: memory × time

4. **Version Control**
   - Tag releases in GitHub
   - Track changes to sites.json
   - Document plugin updates

5. **Regular Maintenance**
   - Review failed sites monthly
   - Update selectors as sites change
   - Remove inactive directories

6. **Security**
   - Don't hardcode credentials
   - Use Apify secrets for sensitive data
   - Rotate tokens regularly

---

## Next Steps

After setting up your workflow:

1. ✅ Test actor with sample data
2. ✅ Configure sites.json for your needs
3. ✅ Set up scheduled runs
4. ✅ Integrate with Cloudflare Worker (optional)
5. ✅ Monitor results and refine
6. ✅ Add custom plugins as needed

---

## Additional Resources

- [Apify Documentation](https://docs.apify.com/)
- [Apify SDK Reference](https://docs.apify.com/sdk/js/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Cloudflare Integration Guide](./CLOUDFLARE_DEPLOYMENT.md)
- [Management GUI Documentation](./MANAGEMENT_GUI.md)
- [GitHub Repository](https://github.com/kedster/Directory-signup)

---

## Support

For help with Apify workflows:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Apify Platform Status](https://status.apify.com/)
3. Visit [Apify Discord Community](https://discord.com/invite/jyEM2PRvMU)
4. Open issue on GitHub
5. Contact Apify Support (paid plans)

---

## Example Complete Workflow

### Scenario: Deploy and Test

```bash
# 1. Push code to GitHub
git push origin main

# 2. Create actor in Apify Console
# - From GitHub: https://github.com/kedster/Directory-signup
# - Wait for build to complete

# 3. Configure environment
# - Settings → Environment → Add DEBUG=true

# 4. Test run
# - Click "Start"
# - Use minimal test input
# - Monitor logs

# 5. Review results
# - Check dataset for output
# - Download screenshots if failures
# - Update overrides.json

# 6. Schedule recurring runs
# - Create schedule: Weekly Monday 9 AM
# - Add production input data

# 7. Integrate with Cloudflare
# - Deploy worker
# - Configure secrets
# - Test API integration

# Done!
```
