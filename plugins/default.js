/**
 * Default Plugin - Standard form-filling flow
 * Handles most directory sites with common form patterns
 */

export default class DefaultPlugin {
  constructor() {
    this.name = 'default';
  }

  /**
   * Process a site using standard form-filling logic
   * @param {Object} page - Puppeteer page object
   * @param {Object} site - Site configuration from sites.json
   * @param {Object} listing - Listing data to submit
   * @param {Object} overrides - Optional site-specific selector overrides
   * @returns {Object} Result object with status and details
   */
  async process(page, site, listing, overrides = {}) {
    console.log(`  [${this.name}] Processing ${site.name}`);
    
    try {
      // Get selectors from overrides or use defaults
      const selectors = overrides[site.domain]?.selectors || this.getDefaultSelectors();
      
      // Wait a bit for the page to stabilize
      await page.waitForTimeout(1000);
      
      // Try to fill form fields
      const filled = await this.fillForm(page, selectors, listing);
      
      if (!filled) {
        return {
          status: 'needs_override',
          message: 'Could not find form fields with default selectors',
          plugin: this.name
        };
      }
      
      // Optionally submit the form (commented out for safety in default mode)
      // await this.submitForm(page, selectors);
      
      // Wait for any custom selector if specified
      if (overrides[site.domain]?.waitForSelector) {
        try {
          await page.waitForSelector(overrides[site.domain].waitForSelector, { 
            timeout: 5000 
          });
        } catch (e) {
          console.log(`  [${this.name}] Warning: waitForSelector timed out`);
        }
      }
      
      return {
        status: 'success',
        message: 'Form filled successfully',
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
   * Get default form selectors to try
   */
  getDefaultSelectors() {
    return {
      emailInput: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        '#email',
        '#user_email'
      ],
      nameInput: [
        'input[name*="name" i]',
        'input[id*="name" i]',
        'input[placeholder*="name" i]',
        '#name',
        '#product_name',
        '#company_name'
      ],
      websiteInput: [
        'input[type="url"]',
        'input[name*="website" i]',
        'input[name*="url" i]',
        'input[id*="website" i]',
        'input[id*="url" i]',
        '#website',
        '#url'
      ],
      descriptionInput: [
        'textarea[name*="description" i]',
        'textarea[id*="description" i]',
        'textarea[placeholder*="description" i]',
        '#description',
        'textarea'
      ],
      submitButton: [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Send")',
        'button:contains("Sign up")'
      ]
    };
  }

  /**
   * Try to fill the form with listing data
   */
  async fillForm(page, selectors, listing) {
    let foundAny = false;
    
    // Try email input
    if (listing.email) {
      const emailSelector = await this.findSelector(page, selectors.emailInput);
      if (emailSelector) {
        await page.type(emailSelector, listing.email, { delay: 50 });
        console.log(`    ✓ Filled email: ${emailSelector}`);
        foundAny = true;
      }
    }
    
    // Try name input
    if (listing.name) {
      const nameSelector = await this.findSelector(page, selectors.nameInput);
      if (nameSelector) {
        await page.type(nameSelector, listing.name, { delay: 50 });
        console.log(`    ✓ Filled name: ${nameSelector}`);
        foundAny = true;
      }
    }
    
    // Try website input
    if (listing.website) {
      const websiteSelector = await this.findSelector(page, selectors.websiteInput);
      if (websiteSelector) {
        await page.type(websiteSelector, listing.website, { delay: 50 });
        console.log(`    ✓ Filled website: ${websiteSelector}`);
        foundAny = true;
      }
    }
    
    // Try description input
    if (listing.description) {
      const descSelector = await this.findSelector(page, selectors.descriptionInput);
      if (descSelector) {
        await page.type(descSelector, listing.description, { delay: 50 });
        console.log(`    ✓ Filled description: ${descSelector}`);
        foundAny = true;
      }
    }
    
    return foundAny;
  }

  /**
   * Find the first selector that exists on the page
   */
  async findSelector(page, selectorList) {
    if (!Array.isArray(selectorList)) {
      selectorList = [selectorList];
    }
    
    for (const selector of selectorList) {
      try {
        const element = await page.$(selector);
        if (element) {
          return selector;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  /**
   * Submit the form (use with caution)
   */
  async submitForm(page, selectors) {
    const submitSelector = await this.findSelector(page, selectors.submitButton);
    if (submitSelector) {
      console.log(`    ✓ Found submit button: ${submitSelector}`);
      // await page.click(submitSelector);
      console.log(`    ⚠ Submit disabled in default mode for safety`);
    }
  }
}
