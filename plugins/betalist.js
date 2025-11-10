/**
 * BetaList Plugin - Custom flow for BetaList submissions
 * Handles BetaList-specific form patterns and requirements
 */

export default class BetaListPlugin {
  constructor() {
    this.name = 'betalist';
  }

  /**
   * Process BetaList site with custom logic
   * @param {Object} page - Puppeteer page object
   * @param {Object} site - Site configuration from sites.json
   * @param {Object} listing - Listing data to submit
   * @param {Object} overrides - Optional site-specific selector overrides
   * @returns {Object} Result object with status and details
   */
  async process(page, site, listing, overrides = {}) {
    console.log(`  [${this.name}] Processing ${site.name} with custom BetaList flow`);
    
    try {
      // BetaList-specific selectors
      const selectors = overrides[site.domain]?.selectors || {
        nameInput: 'input#startup_name',
        websiteInput: 'input#startup_url',
        taglineInput: 'input#startup_tagline',
        descriptionInput: 'textarea#startup_pitch',
        emailInput: 'input#startup_email',
        twitterInput: 'input#startup_twitter',
        submitButton: 'input[type="submit"]'
      };
      
      // Wait for page to be ready
      await page.waitForTimeout(1500);
      
      // Fill BetaList-specific fields
      await this.fillBetaListForm(page, selectors, listing);
      
      console.log(`    ✓ BetaList form filled successfully`);
      
      return {
        status: 'success',
        message: 'BetaList form prepared successfully',
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

  /**
   * Fill BetaList-specific form fields
   */
  async fillBetaListForm(page, selectors, listing) {
    // Startup name
    if (listing.name) {
      const nameInput = await page.$(selectors.nameInput);
      if (nameInput) {
        await page.type(selectors.nameInput, listing.name, { delay: 50 });
        console.log(`    ✓ Filled startup name`);
      }
    }
    
    // Website URL
    if (listing.website) {
      const websiteInput = await page.$(selectors.websiteInput);
      if (websiteInput) {
        await page.type(selectors.websiteInput, listing.website, { delay: 50 });
        console.log(`    ✓ Filled website URL`);
      }
    }
    
    // Tagline
    const tagline = listing.tagline || (listing.description?.substring(0, 80));
    if (tagline) {
      const taglineInput = await page.$(selectors.taglineInput);
      if (taglineInput) {
        await page.type(selectors.taglineInput, tagline, { delay: 50 });
        console.log(`    ✓ Filled tagline`);
      }
    }
    
    // Pitch/Description
    if (listing.description) {
      const descInput = await page.$(selectors.descriptionInput);
      if (descInput) {
        await page.type(selectors.descriptionInput, listing.description, { delay: 30 });
        console.log(`    ✓ Filled pitch/description`);
      }
    }
    
    // Email
    if (listing.email) {
      const emailInput = await page.$(selectors.emailInput);
      if (emailInput) {
        await page.type(selectors.emailInput, listing.email, { delay: 50 });
        console.log(`    ✓ Filled email`);
      }
    }
    
    // Twitter handle (optional)
    if (listing.twitter) {
      const twitterInput = await page.$(selectors.twitterInput);
      if (twitterInput) {
        const twitterHandle = listing.twitter.replace('@', '');
        await page.type(selectors.twitterInput, twitterHandle, { delay: 50 });
        console.log(`    ✓ Filled Twitter handle`);
      }
    }
  }
}
