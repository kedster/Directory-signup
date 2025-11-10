/**
 * ProductHunt Plugin - Custom flow for Product Hunt submissions
 * Handles ProductHunt-specific form patterns and requirements
 */

export default class ProductHuntPlugin {
  constructor() {
    this.name = 'producthunt';
  }

  /**
   * Process ProductHunt site with custom logic
   * @param {Object} page - Puppeteer page object
   * @param {Object} site - Site configuration from sites.json
   * @param {Object} listing - Listing data to submit
   * @param {Object} overrides - Optional site-specific selector overrides
   * @returns {Object} Result object with status and details
   */
  async process(page, site, listing, overrides = {}) {
    console.log(`  [${this.name}] Processing ${site.name} with custom ProductHunt flow`);
    
    try {
      // ProductHunt-specific selectors
      const selectors = overrides[site.domain]?.selectors || {
        nameInput: 'input[name="name"]',
        taglineInput: 'input[name="tagline"]',
        websiteInput: 'input[name="url"]',
        descriptionInput: 'textarea[name="description"]',
        categorySelect: 'select[name="category"]',
        submitButton: 'button[type="submit"]'
      };
      
      // Wait for page to be ready
      await page.waitForTimeout(2000);
      
      // Check if we need to login first (ProductHunt requires auth)
      const loginRequired = await page.$('a[href*="login"]');
      if (loginRequired) {
        console.log(`    ⚠ ProductHunt requires authentication`);
        return {
          status: 'needs_auth',
          message: 'ProductHunt requires login before submission',
          plugin: this.name
        };
      }
      
      // Fill ProductHunt-specific fields
      await this.fillProductHuntForm(page, selectors, listing);
      
      // ProductHunt-specific validations
      const validated = await this.validateForm(page);
      if (!validated) {
        return {
          status: 'validation_failed',
          message: 'Form validation failed on ProductHunt',
          plugin: this.name
        };
      }
      
      console.log(`    ✓ ProductHunt form filled and validated`);
      
      return {
        status: 'success',
        message: 'ProductHunt form prepared (manual review recommended)',
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
   * Fill ProductHunt-specific form fields
   */
  async fillProductHuntForm(page, selectors, listing) {
    // Product name
    if (listing.name) {
      const nameInput = await page.$(selectors.nameInput);
      if (nameInput) {
        await page.type(selectors.nameInput, listing.name, { delay: 50 });
        console.log(`    ✓ Filled product name`);
      }
    }
    
    // Tagline (if available in listing or use description excerpt)
    const tagline = listing.tagline || (listing.description?.substring(0, 60) + '...');
    if (tagline) {
      const taglineInput = await page.$(selectors.taglineInput);
      if (taglineInput) {
        await page.type(selectors.taglineInput, tagline, { delay: 50 });
        console.log(`    ✓ Filled tagline`);
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
    
    // Description
    if (listing.description) {
      const descInput = await page.$(selectors.descriptionInput);
      if (descInput) {
        await page.type(selectors.descriptionInput, listing.description, { delay: 30 });
        console.log(`    ✓ Filled description`);
      }
    }
    
    // Category (if available)
    if (listing.category && selectors.categorySelect) {
      try {
        const categorySelect = await page.$(selectors.categorySelect);
        if (categorySelect) {
          await page.select(selectors.categorySelect, listing.category);
          console.log(`    ✓ Selected category`);
        }
      } catch (e) {
        console.log(`    ⚠ Could not select category: ${e.message}`);
      }
    }
  }

  /**
   * Validate form before submission
   */
  async validateForm(page) {
    // Check for any error messages
    const errors = await page.$$('.error, .error-message, [class*="error"]');
    if (errors.length > 0) {
      console.log(`    ⚠ Found ${errors.length} validation error(s)`);
      return false;
    }
    
    // Check if submit button is enabled
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
      if (isDisabled) {
        console.log(`    ⚠ Submit button is disabled`);
        return false;
      }
    }
    
    return true;
  }
}
