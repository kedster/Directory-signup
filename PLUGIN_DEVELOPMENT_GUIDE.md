# Plugin Development Guide

This guide explains how to create custom plugins for the Directory Signup automation system. Plugins allow you to customize the behavior of the automation for specific directory sites that require special handling.

## Table of Contents

1. [Overview](#overview)
2. [Plugin Structure](#plugin-structure)
3. [Creating a New Plugin](#creating-a-new-plugin)
4. [Plugin API Reference](#plugin-api-reference)
5. [CAPTCHA Integration](#captcha-integration)
6. [Testing Your Plugin](#testing-your-plugin)
7. [Integrating into the System](#integrating-into-the-system)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

## Overview

Plugins are modular JavaScript classes that handle site-specific form filling and submission logic. Each plugin:
- Is a separate JavaScript file in the `/plugins` directory
- Exports a default class with a `process()` method
- Receives a Puppeteer page object, site configuration, and listing data
- Returns a status object indicating success or failure

The plugin system is automatically loaded by `plugin-registry.js` and integrated into the main automation flow.

## Plugin Structure

Every plugin must follow this basic structure:

```javascript
/**
 * Your Plugin Name - Brief description
 * Explain what makes this plugin unique
 */

export default class YourPluginName {
  constructor() {
    // Plugin identifier (must be unique and lowercase)
    this.name = 'yourplugin';
  }

  /**
   * Process a site with custom logic
   * @param {Object} page - Puppeteer page object
   * @param {Object} site - Site configuration from sites.json
   * @param {Object} listing - Listing data to submit (name, email, website, description)
   * @param {Object} overrides - Optional site-specific selector overrides from overrides.json
   * @returns {Object} Result object with status and details
   */
  async process(page, site, listing, overrides = {}) {
    console.log(`  [${this.name}] Processing ${site.name}`);
    
    try {
      // Your custom logic here
      
      return {
        status: 'success',
        message: 'Successfully processed site',
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

### Required Methods

- `constructor()` - Initialize the plugin with a unique name
- `async process(page, site, listing, overrides)` - Main processing logic

### Method Parameters

#### `page` (Puppeteer Page)
The Puppeteer page object with full API access:
```javascript
await page.goto(url);
await page.type(selector, text);
await page.click(selector);
await page.waitForSelector(selector);
// ... and all other Puppeteer methods
```

#### `site` (Site Configuration)
Contains information from `sites.json`:
```javascript
{
  domain: 'example.com',
  url: 'https://example.com/submit',
  name: 'Example Directory',
  plugin: 'yourplugin',
  active: true,
  forceDefaultFlow: false,
  notes: 'Any special instructions'
}
```

#### `listing` (Listing Data)
The product/service information to submit:
```javascript
{
  name: 'Your Product Name',
  email: 'contact@example.com',
  website: 'https://yourproduct.com',
  description: 'Product description...',
  // Optional fields:
  tagline: 'Short tagline',
  category: 'Software',
  twitter: '@yourhandle'
}
```

#### `overrides` (Selector Overrides)
Custom CSS selectors from `overrides.json` (optional):
```javascript
{
  'example.com': {
    selectors: {
      emailInput: '#email-field',
      nameInput: '#product-name',
      websiteInput: '#url',
      descriptionInput: '#description',
      submitButton: 'button.submit'
    },
    waitForSelector: '.success-message'
  }
}
```

### Return Status Object

Your plugin must return an object with:

```javascript
{
  status: 'success' | 'error' | 'needs_override' | 'needs_auth' | 'validation_failed' | 'skipped',
  message: 'Human-readable message about what happened',
  plugin: this.name  // Your plugin name for logging
}
```

**Status Values:**
- `success` - Site processed successfully
- `error` - An error occurred (include error details in message)
- `needs_override` - Site needs custom selectors in overrides.json
- `needs_auth` - Site requires authentication/login
- `validation_failed` - Form validation failed
- `skipped` - Site was skipped (usually because inactive)

## Creating a New Plugin

### Step 1: Create the Plugin File

Create a new file in `/plugins/` directory with a descriptive name:

```bash
touch plugins/mynewsite.js
```

### Step 2: Implement the Plugin Class

```javascript
/**
 * MyNewSite Plugin - Custom flow for MyNewSite directory
 * Handles MyNewSite-specific form patterns and requirements
 */

export default class MyNewSitePlugin {
  constructor() {
    this.name = 'mynewsite';
  }

  async process(page, site, listing, overrides = {}) {
    console.log(`  [${this.name}] Processing ${site.name}`);
    
    try {
      // Define selectors (use overrides if available)
      const selectors = overrides[site.domain]?.selectors || {
        emailInput: 'input[type="email"]',
        nameInput: 'input[name="product-name"]',
        websiteInput: 'input[type="url"]',
        descriptionInput: 'textarea',
        submitButton: 'button[type="submit"]'
      };
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Fill the form
      await this.fillForm(page, selectors, listing);
      
      // Optional: Submit the form
      // await page.click(selectors.submitButton);
      // await page.waitForSelector('.success-message', { timeout: 5000 });
      
      console.log(`    ✓ Form filled successfully`);
      
      return {
        status: 'success',
        message: 'Form filled successfully',
        plugin: this.name
      };
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
        plugin: this.name
      };
    }
  }

  async fillForm(page, selectors, listing) {
    // Email
    if (listing.email && selectors.emailInput) {
      const emailField = await page.$(selectors.emailInput);
      if (emailField) {
        await page.type(selectors.emailInput, listing.email, { delay: 50 });
        console.log(`    ✓ Filled email`);
      }
    }
    
    // Product name
    if (listing.name && selectors.nameInput) {
      const nameField = await page.$(selectors.nameInput);
      if (nameField) {
        await page.type(selectors.nameInput, listing.name, { delay: 50 });
        console.log(`    ✓ Filled product name`);
      }
    }
    
    // Website URL
    if (listing.website && selectors.websiteInput) {
      const websiteField = await page.$(selectors.websiteInput);
      if (websiteField) {
        await page.type(selectors.websiteInput, listing.website, { delay: 50 });
        console.log(`    ✓ Filled website URL`);
      }
    }
    
    // Description
    if (listing.description && selectors.descriptionInput) {
      const descField = await page.$(selectors.descriptionInput);
      if (descField) {
        await page.type(selectors.descriptionInput, listing.description, { delay: 30 });
        console.log(`    ✓ Filled description`);
      }
    }
  }
}
```

### Step 3: Test the Plugin Locally

Run the automation with your plugin assigned to a test site:

```bash
npm start
```

Check the console output and screenshots to verify behavior.

## Plugin API Reference

### Common Puppeteer Operations

```javascript
// Navigation
await page.goto(url, { waitUntil: 'networkidle2' });

// Waiting
await page.waitForTimeout(1000); // Wait 1 second
await page.waitForSelector('.my-element', { timeout: 5000 });
await page.waitForNavigation({ waitUntil: 'networkidle0' });

// Element Checks
const exists = await page.$('.my-element');
const elements = await page.$$('.my-elements');

// Form Filling
await page.type('input#email', 'test@example.com', { delay: 50 });
await page.click('button.submit');
await page.select('select#category', 'software');

// Evaluation (run code in browser context)
const value = await page.evaluate(() => {
  return document.querySelector('.my-element').textContent;
});

// Screenshots (for debugging)
await page.screenshot({ path: 'debug-screenshot.png' });
```

### Accessing Environment Variables

CAPTCHA keys and other credentials are available via environment variables:

```javascript
const captchaKey = process.env.ANTICAPTCHA_KEY;
if (captchaKey) {
  console.log('CAPTCHA key available');
}
```

## CAPTCHA Integration

### Overview

The system supports CAPTCHA solving through services like [2Captcha](https://2captcha.com) or [Anti-Captcha](https://anti-captcha.com). The API key is configured via the `ANTICAPTCHA_KEY` environment variable.

### Setting Up CAPTCHA Support

#### On Apify Platform
1. Go to your Actor settings
2. Add environment variable: `ANTICAPTCHA_KEY`
3. Set the value to your API key from 2Captcha or Anti-Captcha

#### Locally
```bash
export ANTICAPTCHA_KEY="your_api_key_here"
npm start
```

### Using CAPTCHA in Your Plugin

Here's an example of how to integrate CAPTCHA solving:

```javascript
export default class CaptchaSitePlugin {
  constructor() {
    this.name = 'captchasite';
  }

  async process(page, site, listing, overrides = {}) {
    try {
      // Fill form fields first
      await this.fillForm(page, listing);
      
      // Check for CAPTCHA
      const hasCaptcha = await page.$('.g-recaptcha, iframe[src*="recaptcha"]');
      
      if (hasCaptcha) {
        console.log(`    ⚠ CAPTCHA detected`);
        
        const captchaKey = process.env.ANTICAPTCHA_KEY;
        if (!captchaKey) {
          return {
            status: 'error',
            message: 'CAPTCHA detected but no ANTICAPTCHA_KEY configured',
            plugin: this.name
          };
        }
        
        // Solve the CAPTCHA
        const solved = await this.solveCaptcha(page, captchaKey);
        if (!solved) {
          return {
            status: 'error',
            message: 'Failed to solve CAPTCHA',
            plugin: this.name
          };
        }
        
        console.log(`    ✓ CAPTCHA solved`);
      }
      
      // Continue with submission
      return {
        status: 'success',
        message: 'Form submitted with CAPTCHA',
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

  async solveCaptcha(page, apiKey) {
    // Get the site key from the page
    const siteKey = await page.evaluate(() => {
      const recaptchaElement = document.querySelector('.g-recaptcha');
      return recaptchaElement ? recaptchaElement.getAttribute('data-sitekey') : null;
    });
    
    if (!siteKey) {
      console.log(`    ✗ Could not find reCAPTCHA site key`);
      return false;
    }
    
    console.log(`    → Solving CAPTCHA with site key: ${siteKey}`);
    
    // Call the CAPTCHA solving service
    // This is a simplified example - actual implementation would need:
    // 1. Submit CAPTCHA task to service API
    // 2. Poll for result
    // 3. Inject solution into page
    
    try {
      // Example using 2Captcha API structure
      const taskResponse = await this.submitCaptchaTask(apiKey, siteKey, page.url());
      if (!taskResponse.taskId) {
        return false;
      }
      
      // Wait for solution
      const solution = await this.waitForCaptchaSolution(apiKey, taskResponse.taskId);
      if (!solution) {
        return false;
      }
      
      // Inject solution into page
      await page.evaluate((token) => {
        document.getElementById('g-recaptcha-response').innerHTML = token;
      }, solution);
      
      return true;
      
    } catch (error) {
      console.error(`    ✗ CAPTCHA solving error: ${error.message}`);
      return false;
    }
  }

  async submitCaptchaTask(apiKey, siteKey, pageUrl) {
    // Implementation would call 2Captcha/Anti-Captcha API
    // Returns { taskId: 'xxx' }
    // See: https://2captcha.com/2captcha-api#solving_recaptchav2_new
    throw new Error('Implement CAPTCHA API call');
  }

  async waitForCaptchaSolution(apiKey, taskId) {
    // Poll the CAPTCHA service for the solution
    // Returns the solved token string
    throw new Error('Implement CAPTCHA polling');
  }

  async fillForm(page, listing) {
    // Form filling logic
  }
}
```

### CAPTCHA Services

**2Captcha:**
- Website: https://2captcha.com
- API Docs: https://2captcha.com/2captcha-api
- Supports: reCAPTCHA v2, v3, hCaptcha, image CAPTCHA

**Anti-Captcha:**
- Website: https://anti-captcha.com
- API Docs: https://anti-captcha.com/apidoc
- Supports: reCAPTCHA v2, v3, hCaptcha, FunCaptcha

### CAPTCHA Best Practices

1. **Always check for CAPTCHA presence** before assuming it's needed
2. **Provide clear error messages** when CAPTCHA key is missing
3. **Add delays** after CAPTCHA solving to appear more human-like
4. **Handle timeouts** - CAPTCHA solving can take 10-30 seconds
5. **Log all CAPTCHA attempts** for debugging

## Testing Your Plugin

### Local Testing

1. **Assign the plugin to a site** in `sites.json`:
```json
{
  "domain": "example.com",
  "url": "https://example.com/submit",
  "name": "Example Directory",
  "plugin": "mynewsite",
  "active": true
}
```

2. **Run the automation**:
```bash
npm start
```

3. **Check the output**:
   - Console logs show plugin activity
   - Screenshots saved to `/screenshots` folder
   - HTML snapshots saved to `/html_snapshots` folder

4. **Review the results** in `results.json`

### Testing Specific Sites

You can modify `main.js` temporarily to test only specific sites:

```javascript
// Filter to test only your new site
const sitesToProcess = sites.filter(s => s.domain === 'example.com');
```

### Debugging Tips

1. **Add console.log statements** liberally:
```javascript
console.log(`    → Attempting to find selector: ${selector}`);
```

2. **Take screenshots at key points**:
```javascript
await page.screenshot({ path: `debug-${Date.now()}.png` });
```

3. **Check element existence** before interaction:
```javascript
const button = await page.$(selector);
if (!button) {
  console.log(`    ✗ Button not found: ${selector}`);
  return;
}
```

4. **Use try-catch blocks** around risky operations:
```javascript
try {
  await page.click(selector, { timeout: 5000 });
} catch (error) {
  console.log(`    ⚠ Could not click: ${error.message}`);
}
```

## Integrating into the System

### Automatic Plugin Discovery

The plugin system automatically discovers your plugin if it's in the `/plugins` directory and exports a default class. No registration is needed!

The `plugin-registry.js` file:
1. Scans the `/plugins` directory
2. Loads all `.js` files
3. Instantiates the plugin classes
4. Makes them available to the automation

### Assigning Plugins to Sites

#### Method 1: Via GUI (Recommended)

1. Open the Management GUI (`gui/index.html`)
2. Click "Edit" on any site card
3. Select your plugin from the "Plugin" dropdown
4. Click "Save Changes"
5. Click "💾 Save Changes" to commit to repository

#### Method 2: Via sites.json

Edit `/sites.json` directly:

```json
{
  "sites": [
    {
      "domain": "example.com",
      "url": "https://example.com/submit",
      "name": "Example Directory",
      "plugin": "mynewsite",
      "active": true,
      "forceDefaultFlow": false,
      "notes": "Uses custom plugin"
    }
  ]
}
```

#### Method 3: Via Overrides

Add plugin preference in `overrides.json`:

```json
{
  "example.com": {
    "plugin": "mynewsite",
    "selectors": {
      "emailInput": "#email"
    }
  }
}
```

### Plugin Fallback Behavior

If a plugin fails or is unavailable, the system automatically falls back to the `default` plugin. You can force use of the default plugin by setting `forceDefaultFlow: true` in site configuration.

## Best Practices

### 1. Error Handling

Always wrap risky operations in try-catch blocks:

```javascript
try {
  await page.click(selector);
} catch (error) {
  return {
    status: 'error',
    message: `Click failed: ${error.message}`,
    plugin: this.name
  };
}
```

### 2. Timeouts

Set appropriate timeouts for operations:

```javascript
await page.waitForSelector('.element', { timeout: 5000 });
```

### 3. Human-Like Behavior

Add delays to appear more human:

```javascript
await page.type(selector, text, { delay: 50 }); // 50ms between keystrokes
await page.waitForTimeout(1000); // Pause between actions
```

### 4. Logging

Provide clear, hierarchical logging:

```javascript
console.log(`  [${this.name}] Processing ${site.name}`);
console.log(`    → Looking for email field`);
console.log(`    ✓ Email field found`);
console.log(`    ✗ Submit button not found`);
```

### 5. Selector Robustness

Try multiple selector strategies:

```javascript
const emailInput = await page.$('input[type="email"]') 
  || await page.$('#email')
  || await page.$('[name="email"]')
  || await page.$('.email-input');
```

### 6. Validation

Validate before submission:

```javascript
async validateForm(page) {
  const errors = await page.$$('.error-message');
  if (errors.length > 0) {
    return false;
  }
  
  const submitButton = await page.$('button[type="submit"]');
  const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
  
  return !isDisabled;
}
```

### 7. Don't Submit by Default

For safety, don't auto-submit forms in plugins unless specifically configured:

```javascript
// Good - commented out by default
// await page.click(selectors.submitButton);

// Add a flag for submission
if (overrides[site.domain]?.autoSubmit) {
  await page.click(selectors.submitButton);
}
```

### 8. Documentation

Add clear documentation in your plugin file:

```javascript
/**
 * MyPlugin - Handles special site requirements
 * 
 * Special requirements:
 * - Site requires login before submission
 * - Form has multi-step process
 * - CAPTCHA may appear randomly
 * 
 * Configuration in overrides.json:
 * {
 *   "example.com": {
 *     "selectors": { ... },
 *     "autoSubmit": true,
 *     "username": "test@example.com"
 *   }
 * }
 */
```

## Examples

### Example 1: Simple Form Plugin

```javascript
export default class SimpleFormPlugin {
  constructor() {
    this.name = 'simpleform';
  }

  async process(page, site, listing, overrides = {}) {
    try {
      await page.waitForTimeout(1000);
      
      // Fill email
      await page.type('input[type="email"]', listing.email);
      
      // Fill name
      await page.type('input[name="name"]', listing.name);
      
      // Fill description
      await page.type('textarea', listing.description);
      
      return {
        status: 'success',
        message: 'Form filled',
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

### Example 2: Multi-Step Form Plugin

```javascript
export default class MultiStepPlugin {
  constructor() {
    this.name = 'multistep';
  }

  async process(page, site, listing, overrides = {}) {
    try {
      // Step 1: Basic info
      await this.fillStep1(page, listing);
      await page.click('button.next');
      await page.waitForSelector('.step-2');
      
      // Step 2: Details
      await this.fillStep2(page, listing);
      await page.click('button.next');
      await page.waitForSelector('.step-3');
      
      // Step 3: Review
      await page.click('button.submit');
      
      return {
        status: 'success',
        message: 'Multi-step form completed',
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

  async fillStep1(page, listing) {
    await page.type('#name', listing.name);
    await page.type('#email', listing.email);
  }

  async fillStep2(page, listing) {
    await page.type('#website', listing.website);
    await page.type('#description', listing.description);
  }
}
```

### Example 3: Authentication Required Plugin

```javascript
export default class AuthRequiredPlugin {
  constructor() {
    this.name = 'authrequired';
  }

  async process(page, site, listing, overrides = {}) {
    try {
      // Check if already logged in
      const isLoggedIn = await page.$('.user-menu');
      
      if (!isLoggedIn) {
        console.log(`    ⚠ Login required`);
        
        // Check if credentials are in overrides
        const credentials = overrides[site.domain]?.credentials;
        if (!credentials) {
          return {
            status: 'needs_auth',
            message: 'Site requires login. Add credentials to overrides.json',
            plugin: this.name
          };
        }
        
        // Perform login
        await this.login(page, credentials);
      }
      
      // Continue with form filling
      await this.fillForm(page, listing);
      
      return {
        status: 'success',
        message: 'Submitted with authentication',
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

  async login(page, credentials) {
    await page.goto('https://example.com/login');
    await page.type('#username', credentials.username);
    await page.type('#password', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log(`    ✓ Logged in successfully`);
  }

  async fillForm(page, listing) {
    // Form filling logic
  }
}
```

## Troubleshooting

### Plugin Not Loading

**Problem:** Plugin doesn't appear in the system

**Solutions:**
1. Ensure file is in `/plugins` directory
2. Check file ends with `.js`
3. Verify it exports a default class
4. Check for syntax errors in the plugin file
5. Restart the automation

### Selectors Not Working

**Problem:** Cannot find form elements

**Solutions:**
1. Inspect the page with browser DevTools
2. Try multiple selector strategies (ID, class, attribute, XPath)
3. Wait for elements to load with `waitForSelector`
4. Check if elements are in an iframe
5. Add delays before element interaction

### Plugin Times Out

**Problem:** Plugin hangs or times out

**Solutions:**
1. Add explicit timeouts to operations
2. Check for infinite loops or missing await keywords
3. Verify waitForSelector has timeout parameter
4. Add console.log to identify where it hangs

### Form Submission Fails

**Problem:** Form doesn't submit or shows errors

**Solutions:**
1. Check form validation errors on the page
2. Verify all required fields are filled
3. Add delays before submission
4. Check for CAPTCHA challenges
5. Validate button is enabled before clicking

## Support

For help with plugin development:

1. **Review existing plugins** in `/plugins` folder as examples
2. **Check console output** for detailed error messages
3. **Inspect screenshots** in `/screenshots` folder
4. **Review HTML snapshots** in `/html_snapshots` folder
5. **Read the main documentation** in `README.md` and `MANAGEMENT_GUI.md`

## Summary

Creating a custom plugin involves:

1. ✅ Create a new `.js` file in `/plugins`
2. ✅ Export a class with `constructor()` and `async process()`
3. ✅ Implement site-specific form filling logic
4. ✅ Handle errors and return appropriate status objects
5. ✅ Test locally with `npm start`
6. ✅ Assign plugin to sites in `sites.json` or via GUI
7. ✅ Deploy and monitor on Apify platform

Happy plugin development! 🚀
