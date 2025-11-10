# Cloudflare Workers Deployment Guide

This guide provides step-by-step instructions for deploying and configuring the Directory Signup Management API using Cloudflare Workers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Overview

The Cloudflare Worker provides an API layer that enables:
- **Automated GitHub commits** for sites.json updates
- **API endpoints** for the Management GUI
- **Apify actor triggering** for workflow automation
- **CORS-enabled** REST API for cross-origin requests

### Architecture

```
Management GUI (Cloudflare Pages)
         ↓
Cloudflare Worker API
         ↓
    ┌────┴────┐
    ↓         ↓
GitHub API   Apify API
```

---

## Prerequisites

Before you begin, ensure you have:

1. **Cloudflare Account**
   - Free tier is sufficient
   - Sign up at [cloudflare.com](https://cloudflare.com)

2. **Node.js & npm**
   - Node.js 16 or higher
   - Install from [nodejs.org](https://nodejs.org)

3. **Wrangler CLI**
   - Cloudflare's official CLI tool
   - Install globally:
     ```bash
     npm install -g wrangler
     ```

4. **GitHub Personal Access Token**
   - Required for committing to repositories
   - Create at: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Required scopes: `repo` (full control of private repositories)

5. **Apify API Token** (Optional)
   - Required if you want to trigger Apify runs from the API
   - Find at: Apify Console → Settings → API tokens

---

## Installation & Setup

### Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication. Follow the prompts to authorize Wrangler.

### Step 2: Verify Authentication

```bash
wrangler whoami
```

You should see your Cloudflare account details.

### Step 3: Navigate to Worker Directory

```bash
cd worker
```

### Step 4: Review Worker Configuration

Open `wrangler.toml` and update the configuration:

```toml
name = "directory-signup-api"
main = "index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.staging]
vars = { ENVIRONMENT = "staging" }
```

**Key fields to customize:**
- `name`: Your worker name (must be unique across Cloudflare)
- `compatibility_date`: Keep current or update to latest
- `routes`: Configure custom domains (optional)

---

## Configuration

### Environment Variables

The worker uses Cloudflare secrets for sensitive data. Configure them using Wrangler:

#### Required Secrets

1. **GitHub Token** (for committing sites.json)
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```
   When prompted, paste your GitHub Personal Access Token.

2. **GitHub Repository Info** (as variables in wrangler.toml)
   ```toml
   [vars]
   GITHUB_OWNER = "kedster"
   GITHUB_REPO = "Directory-signup"
   GITHUB_BRANCH = "main"
   ```

#### Optional Secrets

3. **Apify API Token** (for triggering actor runs)
   ```bash
   wrangler secret put APIFY_API_TOKEN
   ```
   When prompted, paste your Apify API token.

4. **Anti-Captcha API Key** (for solving CAPTCHAs automatically)
   ```bash
   wrangler secret put ANTICAPTCHA_KEY
   ```
   When prompted, paste your Anti-Captcha API key from services like 2Captcha or Anti-Captcha.

5. **Apify Actor ID** (as variable)
   ```toml
   [vars]
   APIFY_ACTOR_ID = "your-actor-id"
   ```

### Update wrangler.toml

Complete example configuration:

```toml
name = "directory-signup-api"
main = "index.js"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
GITHUB_OWNER = "kedster"
GITHUB_REPO = "Directory-signup"
GITHUB_BRANCH = "main"
APIFY_ACTOR_ID = "your-apify-actor-id"

# Optional: Custom domain routing
# Uncomment and configure if using custom domain
# [[routes]]
# pattern = "api.yourdomain.com/*"
# zone_name = "yourdomain.com"
```

---

## Deployment

### Deploy to Production

```bash
wrangler deploy
```

**Output example:**
```
 ⛅️ wrangler 3.x.x
-------------------
✨ Successfully published your script to
   https://directory-signup-api.yourname.workers.dev
```

### Deploy to Staging

```bash
wrangler deploy --env staging
```

### View Deployment

After deployment, Wrangler will provide a URL like:
```
https://directory-signup-api.yourname.workers.dev
```

---

## Testing

### Test API Endpoints

#### 1. Test API Documentation Endpoint

```bash
curl https://directory-signup-api.yourname.workers.dev/api
```

**Expected response:**
```json
{
  "name": "Directory Signup Management API",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/sites": "Get all sites configuration",
    "PUT /api/sites": "Update sites configuration",
    "PUT /api/sites/:id": "Update a specific site",
    "GET /api/plugins": "List available plugins",
    "POST /api/run": "Trigger Apify actor run"
  }
}
```

#### 2. Test Get Sites

```bash
curl https://directory-signup-api.yourname.workers.dev/api/sites
```

#### 3. Test Get Plugins

```bash
curl https://directory-signup-api.yourname.workers.dev/api/plugins
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "name": "default",
        "description": "Standard form-filling flow for most directory sites",
        "active": true
      },
      {
        "name": "producthunt",
        "description": "Custom flow for Product Hunt submissions",
        "active": true
      },
      {
        "name": "betalist",
        "description": "Custom flow for BetaList submissions",
        "active": true
      }
    ]
  }
}
```

#### 4. Test Update Sites (requires setup)

```bash
curl -X PUT https://directory-signup-api.yourname.workers.dev/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "sites": [
      {
        "domain": "example.com",
        "url": "https://example.com/submit",
        "name": "Example Directory",
        "plugin": "default",
        "active": true
      }
    ]
  }'
```

#### 5. Test Trigger Apify Run (requires setup)

```bash
curl -X POST https://directory-signup-api.yourname.workers.dev/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "sites": ["producthunt.com", "betalist.com"],
    "listings": [{
      "name": "My Startup",
      "email": "test@example.com",
      "website": "https://mystartup.com",
      "description": "A great product"
    }]
  }'
```

### View Real-time Logs

Monitor your worker in real-time:

```bash
wrangler tail
```

This will stream logs as requests come in, useful for debugging.

### View Deployment History

```bash
wrangler deployments list
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem:** `Error: Not authenticated`

**Solution:**
```bash
wrangler logout
wrangler login
```

#### 2. Secret Not Found

**Problem:** `Error: Secret 'GITHUB_TOKEN' not found`

**Solution:**
```bash
wrangler secret put GITHUB_TOKEN
```

#### 3. CORS Errors in Browser

**Problem:** Browser shows CORS error when calling API

**Solution:** 
- Verify worker is deployed with correct CORS headers
- Check browser console for specific error
- Worker already includes CORS headers for all origins (`*`)

#### 4. 404 Errors

**Problem:** API endpoints return 404

**Solution:**
- Check URL path (should include `/api/`)
- Verify worker is deployed: `wrangler deployments list`
- Check route configuration in `wrangler.toml`

#### 5. GitHub API Errors

**Problem:** `Error: Bad credentials` or `Error: Not Found`

**Solution:**
- Verify GitHub token has correct permissions (`repo` scope)
- Check GITHUB_OWNER and GITHUB_REPO variables
- Ensure token hasn't expired

### Debug Commands

```bash
# View current configuration
wrangler whoami

# List all secrets (names only, not values)
wrangler secret list

# View deployment logs
wrangler tail

# Delete and redeploy
wrangler delete directory-signup-api
wrangler deploy
```

### Enable Detailed Logging

Add console.log statements in `index.js`:

```javascript
console.log('Request received:', {
  method: request.method,
  url: request.url,
  headers: Object.fromEntries(request.headers)
});
```

Then monitor with:
```bash
wrangler tail
```

---

## Advanced Configuration

### Custom Domain Setup

1. **Add Domain to Cloudflare**
   - Go to Cloudflare Dashboard → Add Site
   - Follow DNS setup instructions

2. **Configure Route in wrangler.toml**
   ```toml
   [[routes]]
   pattern = "api.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

3. **Deploy with Route**
   ```bash
   wrangler deploy
   ```

### Environment-Specific Configurations

Create separate environments for development, staging, and production:

```toml
[env.production]
vars = { ENVIRONMENT = "production", DEBUG = "false" }

[env.staging]
vars = { ENVIRONMENT = "staging", DEBUG = "true" }

[env.development]
vars = { ENVIRONMENT = "development", DEBUG = "true" }
```

Deploy to specific environment:
```bash
wrangler deploy --env staging
```

### KV Storage for Site Caching

For better performance, use Cloudflare KV to cache sites.json:

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "SITES_CACHE"
   ```

2. **Add to wrangler.toml**
   ```toml
   kv_namespaces = [
     { binding = "SITES_CACHE", id = "your-namespace-id" }
   ]
   ```

3. **Use in Code**
   ```javascript
   // Store in KV
   await env.SITES_CACHE.put('sites', JSON.stringify(sites));
   
   // Retrieve from KV
   const cachedSites = await env.SITES_CACHE.get('sites', 'json');
   ```

### Rate Limiting

Add rate limiting to protect your API:

```javascript
// Add to worker code
const rateLimitKey = `ratelimit:${clientIP}`;
const requests = await env.RATE_LIMIT.get(rateLimitKey) || 0;

if (requests > 100) {
  return new Response('Rate limit exceeded', { status: 429 });
}

await env.RATE_LIMIT.put(rateLimitKey, requests + 1, { expirationTtl: 60 });
```

### Monitoring & Analytics

Enable Worker Analytics in Cloudflare Dashboard:
- Dashboard → Workers & Pages → Your Worker → Metrics

View metrics:
- Request count
- Error rate
- CPU time
- Response time

---

## Integration with Management GUI

### Configure GUI to Use Worker

Update `gui/index.html` to use your worker URL:

```javascript
const API_BASE_URL = 'https://directory-signup-api.yourname.workers.dev';

// Example API call
async function fetchSites() {
  const response = await fetch(`${API_BASE_URL}/api/sites`);
  const data = await response.json();
  return data;
}
```

### CORS Configuration

The worker is pre-configured to allow all origins (`*`). For production, consider restricting:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-gui-domain.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment-specific tokens** for dev/staging/production
3. **Implement authentication** for sensitive endpoints
4. **Add rate limiting** to prevent abuse
5. **Validate all inputs** before processing
6. **Use HTTPS only** (Cloudflare enforces this by default)
7. **Rotate tokens regularly** (every 90 days recommended)
8. **Monitor logs** for suspicious activity

---

## Next Steps

After deploying your worker:

1. ✅ Test all API endpoints
2. ✅ Configure Management GUI to use worker URL
3. ✅ Set up GitHub secrets and test commits
4. ✅ Configure Apify integration (optional)
5. ✅ Set up custom domain (optional)
6. ✅ Enable monitoring and alerts

---

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Apify API Documentation](https://docs.apify.com/api/v2)
- [Management GUI Documentation](./MANAGEMENT_GUI.md)
- [Apify Workflow Guide](./APIFY_WORKFLOW.md)

---

## Support

If you encounter issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Cloudflare Workers Status](https://www.cloudflarestatus.com/)
3. Open an issue on GitHub
4. Check Cloudflare Workers Community forum
