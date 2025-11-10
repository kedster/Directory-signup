import Apify from 'apify';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pluginRegistry from './plugin-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONCURRENT_LIMIT = 5;
const TIMEOUT = 30000; // 30 seconds
const SCREENSHOTS_DIR = './screenshots';
const HTML_SNAPSHOTS_DIR = './html_snapshots';

// Anti-CAPTCHA configuration
// Set ANTICAPTCHA_KEY environment variable to enable automatic CAPTCHA solving
// Supports services like 2Captcha (https://2captcha.com) or Anti-Captcha (https://anti-captcha.com)
const ANTICAPTCHA_KEY = process.env.ANTICAPTCHA_KEY || null;

// Ensure output directories exist
async function ensureDirectories() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(HTML_SNAPSHOTS_DIR, { recursive: true });
}

// Load sites configuration
async function loadSites() {
  const data = await fs.readFile('./sites.json', 'utf8');
  const sitesData = JSON.parse(data);
  
  // Support both old format (array) and new format (object with sites array)
  if (Array.isArray(sitesData)) {
    return sitesData;
  } else if (sitesData.sites && Array.isArray(sitesData.sites)) {
    return sitesData.sites;
  }
  
  throw new Error('Invalid sites.json format');
}

// Load overrides configuration
async function loadOverrides() {
  try {
    const data = await fs.readFile('./overrides.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No overrides.json found or error loading it, using defaults');
    return {};
  }
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'unknown';
  }
}

// Save screenshot on failure
async function saveScreenshot(page, siteName, timestamp) {
  const filename = `${siteName}_${timestamp}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  Screenshot saved: ${filepath}`);
  return filepath;
}

// Save HTML snapshot on failure
async function saveHTMLSnapshot(page, siteName, timestamp) {
  const filename = `${siteName}_${timestamp}.html`;
  const filepath = path.join(HTML_SNAPSHOTS_DIR, filename);
  const html = await page.content();
  await fs.writeFile(filepath, html, 'utf8');
  console.log(`  HTML snapshot saved: ${filepath}`);
  return filepath;
}

// Process a single site
async function processSite(site, overrides, browser, listing) {
  const siteName = (site.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const startTime = Date.now();
  const timestamp = Date.now();
  
  console.log(`\n[${siteName}] Starting signup process...`);
  console.log(`  URL: ${site.url || site.startUrl}`);
  console.log(`  Plugin: ${site.plugin || 'default'}`);
  console.log(`  Active: ${site.active !== false}`);
  
  // Skip inactive sites
  if (site.active === false) {
    console.log(`  ⊘ Skipping inactive site`);
    return {
      site: site.name,
      status: 'skipped',
      message: 'Site is marked as inactive',
      duration: 0
    };
  }
  
  let page;
  try {
    page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the site
    const siteUrl = site.url || site.startUrl;
    console.log(`  Navigating to ${siteUrl}...`);
    await page.goto(siteUrl, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });
    
    // Use plugin system to process the site
    const pluginResult = await pluginRegistry.processSite(site, page, listing, overrides);
    
    const duration = Date.now() - startTime;
    
    if (pluginResult.status === 'success') {
      console.log(`  ✓ Success! (${duration}ms)`);
    } else if (pluginResult.status === 'needs_override') {
      console.log(`  ⚠ Needs configuration (${duration}ms)`);
      // Save diagnostic information
      await saveScreenshot(page, siteName, timestamp);
      await saveHTMLSnapshot(page, siteName, timestamp);
      pluginResult.screenshotPath = path.join(SCREENSHOTS_DIR, `${siteName}_${timestamp}.png`);
      pluginResult.htmlPath = path.join(HTML_SNAPSHOTS_DIR, `${siteName}_${timestamp}.html`);
    }
    
    return {
      site: site.name,
      ...pluginResult,
      duration,
      listing: listing
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`  ✗ Error: ${error.message}`);
    
    try {
      if (page) {
        await saveScreenshot(page, siteName, timestamp);
        await saveHTMLSnapshot(page, siteName, timestamp);
      }
    } catch (saveError) {
      console.error(`  Failed to save diagnostic files: ${saveError.message}`);
    }
    
    return {
      site: site.name,
      status: 'error',
      error: error.message,
      duration,
      screenshotPath: page ? path.join(SCREENSHOTS_DIR, `${siteName}_${timestamp}.png`) : null,
      htmlPath: page ? path.join(HTML_SNAPSHOTS_DIR, `${siteName}_${timestamp}.html`) : null
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Apply custom selectors (placeholder for actual form filling logic)
async function applyCustomSelectors(page, selectors, listing) {
  // This is a placeholder - in a real scenario, you would fill in forms
  // based on the selectors provided and listing data
  console.log('  Applying custom selectors...');
  
  // Example: Check if selectors exist on page and fill with listing data
  if (selectors.emailInput) {
    const emailExists = await page.$(selectors.emailInput);
    if (emailExists) {
      console.log(`    ✓ Found email input: ${selectors.emailInput}`);
      if (listing && listing.email) {
        await page.type(selectors.emailInput, listing.email);
      }
    }
  }
  
  if (selectors.nameInput && listing && listing.name) {
    const nameExists = await page.$(selectors.nameInput);
    if (nameExists) {
      console.log(`    ✓ Found name input: ${selectors.nameInput}`);
      await page.type(selectors.nameInput, listing.name);
    }
  }
  
  if (selectors.websiteInput && listing && listing.website) {
    const websiteExists = await page.$(selectors.websiteInput);
    if (websiteExists) {
      console.log(`    ✓ Found website input: ${selectors.websiteInput}`);
      await page.type(selectors.websiteInput, listing.website);
    }
  }
  
  if (selectors.descriptionInput && listing && listing.description) {
    const descExists = await page.$(selectors.descriptionInput);
    if (descExists) {
      console.log(`    ✓ Found description input: ${selectors.descriptionInput}`);
      await page.type(selectors.descriptionInput, listing.description);
    }
  }
  
  if (selectors.submitButton) {
    const buttonExists = await page.$(selectors.submitButton);
    if (buttonExists) {
      console.log(`    ✓ Found submit button: ${selectors.submitButton}`);
      // In real usage: await page.click(selectors.submitButton);
    }
  }
}

// Process sites in batches
async function processSitesInBatches(sites, overrides, batchSize, listings) {
  const results = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const listing of listings) {
      console.log(`\nProcessing listing: ${listing.name || 'Unknown'}`);
      
      for (let i = 0; i < sites.length; i += batchSize) {
        const batch = sites.slice(i, i + batchSize);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (sites ${i + 1}-${Math.min(i + batchSize, sites.length)} of ${sites.length})`);
        console.log('='.repeat(60));
        
        const batchPromises = batch.map(site => processSite(site, overrides, browser, listing));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < sites.length) {
          console.log('\nWaiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  } finally {
    await browser.close();
  }
  
  return results;
}

// Generate summary report
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const success = results.filter(r => r.status === 'success');
  const needsOverride = results.filter(r => r.status === 'needs_override');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');
  const needsAuth = results.filter(r => r.status === 'needs_auth');
  
  console.log(`\nTotal sites processed: ${results.length}`);
  console.log(`✓ Success: ${success.length}`);
  console.log(`⚠ Needs override: ${needsOverride.length}`);
  console.log(`⊘ Skipped (inactive): ${skipped.length}`);
  console.log(`🔐 Needs authentication: ${needsAuth.length}`);
  console.log(`✗ Errors: ${errors.length}`);
  
  if (needsOverride.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('Sites needing overrides:');
    console.log('-'.repeat(60));
    needsOverride.forEach(result => {
      console.log(`\n${result.site}:`);
      console.log(`  Screenshot: ${result.screenshotPath}`);
      console.log(`  HTML: ${result.htmlPath}`);
      console.log(`  → Open these files to create custom selectors`);
    });
  }
  
  if (needsAuth.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('Sites needing authentication:');
    console.log('-'.repeat(60));
    needsAuth.forEach(result => {
      console.log(`\n${result.site}: ${result.message}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('Failed sites:');
    console.log('-'.repeat(60));
    errors.forEach(result => {
      console.log(`\n${result.site}:`);
      console.log(`  Error: ${result.error}`);
      if (result.screenshotPath) {
        console.log(`  Screenshot: ${result.screenshotPath}`);
        console.log(`  HTML: ${result.htmlPath}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Review screenshots and HTML snapshots in the output folders');
  console.log('2. Add custom selectors to overrides.json for each site');
  console.log('3. Run the script again to process more sites');
  console.log('='.repeat(60) + '\n');
}

// Main function wrapped in Apify.main()
Apify.main(async () => {
  console.log('Directory Signup Automation (Apify Actor)');
  console.log('='.repeat(60));
  
  try {
    // Setup
    await ensureDirectories();
    
    // Load plugins
    await pluginRegistry.loadPlugins();
    
    // Get input from Apify or use defaults
    const input = await Apify.getInput() || {};
    const listings = input.listings || [
      { 
        name: 'Test Startup', 
        email: 'test@example.com', 
        website: 'https://example.com', 
        description: 'Example description' 
      }
    ];
    
    const sites = await loadSites();
    const overrides = await loadOverrides();
    
    console.log(`\nLoaded ${sites.length} sites`);
    console.log(`Processing ${CONCURRENT_LIMIT} sites at a time`);
    console.log(`Processing ${listings.length} listing(s)`);
    
    // Log anti-captcha configuration
    if (ANTICAPTCHA_KEY) {
      console.log(`✓ Anti-CAPTCHA enabled (key configured)`);
    } else {
      console.log(`⚠ Anti-CAPTCHA disabled (no key provided)`);
      console.log(`  Set ANTICAPTCHA_KEY environment variable to enable automatic CAPTCHA solving`);
    }
    console.log('');
    
    // Process sites
    const results = await processSitesInBatches(sites, overrides, CONCURRENT_LIMIT, listings);
    
    // Generate report
    generateReport(results);
    
    // Push results to Apify dataset
    for (const result of results) {
      await Apify.pushData(result);
    }
    
    // Save results to JSON
    await fs.writeFile(
      './results.json',
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log('Detailed results saved to results.json\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
});

export { processSite, loadSites, loadOverrides, extractDomain, ANTICAPTCHA_KEY };
