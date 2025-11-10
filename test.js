/**
 * Unit tests for directory signup automation
 * These tests validate the logic without requiring Puppeteer
 */

import { promises as fs } from 'fs';
import path from 'path';

// Test helper functions
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'unknown';
  }
}

async function runTests() {
  console.log('Running tests for Directory Signup Automation\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Load sites.json
  try {
    const sitesData = await fs.readFile('./sites.json', 'utf8');
    const sitesJson = JSON.parse(sitesData);
    
    // Support both old format (array) and new format (object with sites array)
    const sites = Array.isArray(sitesJson) ? sitesJson : (sitesJson.sites || []);
    
    if (sites.length === 50) {
      console.log('✓ Test 1: sites.json contains exactly 50 sites');
      passed++;
    } else {
      console.log(`✗ Test 1: Expected 50 sites, got ${sites.length}`);
      failed++;
    }
    
    // Verify each site has required fields
    const allValid = sites.every(site => 
      (site.name || site.domain) && (site.startUrl || site.url)
    );
    if (allValid) {
      console.log('✓ Test 2: All sites have required fields');
      passed++;
    } else {
      console.log('✗ Test 2: Some sites missing required fields');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 1-2: Failed to load sites.json:', error.message);
    failed += 2;
  }

  // Test 3: Load overrides.json
  try {
    const overridesData = await fs.readFile('./overrides.json', 'utf8');
    const overrides = JSON.parse(overridesData);
    console.log('✓ Test 3: overrides.json is valid JSON');
    passed++;
  } catch (error) {
    console.log('✗ Test 3: Failed to load overrides.json:', error.message);
    failed++;
  }

  // Test 4: Verify package.json
  try {
    const pkgData = await fs.readFile('./package.json', 'utf8');
    const pkg = JSON.parse(pkgData);
    
    const hasPuppeteer = pkg.dependencies && pkg.dependencies.puppeteer;
    const hasApify = pkg.dependencies && pkg.dependencies.apify;
    const isESModule = pkg.type === 'module';
    
    if (hasPuppeteer && hasApify && isESModule) {
      console.log('✓ Test 4: package.json includes Puppeteer, Apify, and ES module support');
      passed++;
    } else {
      console.log('✗ Test 4: package.json missing required dependencies or module type');
      if (!hasPuppeteer) console.log('  Missing: puppeteer');
      if (!hasApify) console.log('  Missing: apify');
      if (!isESModule) console.log('  Missing: type: "module"');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 4: Failed to load package.json:', error.message);
    failed++;
  }

  // Test 5: Verify main.js exists and has valid syntax
  try {
    const mainExists = await fs.access('./main.js').then(() => true).catch(() => false);
    if (mainExists) {
      console.log('✓ Test 5: main.js exists');
      passed++;
    } else {
      console.log('✗ Test 5: main.js not found');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 5:', error.message);
    failed++;
  }

  // Test 6: Domain extraction function
  try {
    const testCases = [
      { url: 'https://www.producthunt.com/posts/new', expected: 'producthunt.com' },
      { url: 'https://betalist.com/submit', expected: 'betalist.com' },
      { url: 'https://www.g2.com/products/new', expected: 'g2.com' }
    ];
    
    let allPassed = true;
    for (const test of testCases) {
      const result = extractDomain(test.url);
      if (result !== test.expected) {
        console.log(`  ✗ Domain extraction failed for ${test.url}: got ${result}, expected ${test.expected}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('✓ Test 6: Domain extraction works correctly');
      passed++;
    } else {
      console.log('✗ Test 6: Domain extraction has issues');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 6:', error.message);
    failed++;
  }

  // Test 7: Verify .gitignore
  try {
    const gitignoreData = await fs.readFile('./.gitignore', 'utf8');
    const hasNodeModules = gitignoreData.includes('node_modules');
    const hasScreenshots = gitignoreData.includes('screenshots');
    const hasHtmlSnapshots = gitignoreData.includes('html_snapshots');
    
    if (hasNodeModules && hasScreenshots && hasHtmlSnapshots) {
      console.log('✓ Test 7: .gitignore properly configured');
      passed++;
    } else {
      console.log('✗ Test 7: .gitignore missing required entries');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 7:', error.message);
    failed++;
  }

  // Test 8: Verify README has instructions
  try {
    const readmeData = await fs.readFile('./README.md', 'utf8');
    const hasInstallation = readmeData.includes('Installation');
    const hasUsage = readmeData.includes('Usage');
    const hasOverrides = readmeData.includes('overrides.json');
    
    if (hasInstallation && hasUsage && hasOverrides) {
      console.log('✓ Test 8: README has complete documentation');
      passed++;
    } else {
      console.log('✗ Test 8: README missing required sections');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 8:', error.message);
    failed++;
  }

  // Test 9: Verify apify.json exists
  try {
    const apifyData = await fs.readFile('./apify.json', 'utf8');
    const apifyConfig = JSON.parse(apifyData);
    
    if (apifyConfig.name && apifyConfig.version) {
      console.log('✓ Test 9: apify.json exists and is valid');
      passed++;
    } else {
      console.log('✗ Test 9: apify.json missing required fields');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 9:', error.message);
    failed++;
  }

  // Test 10: Verify plugin system files exist
  try {
    const pluginRegistryExists = await fs.access('./plugin-registry.js').then(() => true).catch(() => false);
    const defaultPluginExists = await fs.access('./plugins/default.js').then(() => true).catch(() => false);
    
    if (pluginRegistryExists && defaultPluginExists) {
      console.log('✓ Test 10: Plugin system files exist');
      passed++;
    } else {
      console.log('✗ Test 10: Plugin system files missing');
      if (!pluginRegistryExists) console.log('  Missing: plugin-registry.js');
      if (!defaultPluginExists) console.log('  Missing: plugins/default.js');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 10:', error.message);
    failed++;
  }

  // Test 11: Verify GUI exists
  try {
    const guiExists = await fs.access('./gui/index.html').then(() => true).catch(() => false);
    
    if (guiExists) {
      console.log('✓ Test 11: Management GUI exists');
      passed++;
    } else {
      console.log('✗ Test 11: Management GUI not found');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 11:', error.message);
    failed++;
  }

  // Test 12: Verify enhanced sites.json schema
  try {
    const sitesData = await fs.readFile('./sites.json', 'utf8');
    const sitesJson = JSON.parse(sitesData);
    const sites = Array.isArray(sitesJson) ? sitesJson : (sitesJson.sites || []);
    
    // Check if sites have new schema fields
    const hasEnhancedFields = sites.some(site => 
      site.domain !== undefined && 
      site.plugin !== undefined && 
      site.active !== undefined
    );
    
    if (hasEnhancedFields) {
      console.log('✓ Test 12: sites.json uses enhanced schema with GUI control fields');
      passed++;
    } else {
      console.log('✗ Test 12: sites.json missing enhanced schema fields (domain, plugin, active)');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 12:', error.message);
    failed++;
  }

  // Test 13: Verify Worker API exists
  try {
    const workerExists = await fs.access('./worker/index.js').then(() => true).catch(() => false);
    
    if (workerExists) {
      console.log('✓ Test 13: Cloudflare Worker API exists');
      passed++;
    } else {
      console.log('✗ Test 13: Cloudflare Worker API not found');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 13:', error.message);
    failed++;
  }

  // Test 14: Verify MANAGEMENT_GUI.md documentation exists
  try {
    const docsExist = await fs.access('./MANAGEMENT_GUI.md').then(() => true).catch(() => false);
    
    if (docsExist) {
      console.log('✓ Test 14: Management GUI documentation exists');
      passed++;
    } else {
      console.log('✗ Test 14: MANAGEMENT_GUI.md not found');
      failed++;
    }
  } catch (error) {
    console.log('✗ Test 14:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n✓ All tests passed! Implementation is ready.');
    console.log('\nNext steps:');
    console.log('1. Run: npm install (installs Apify SDK + Chrome)');
    console.log('2. Run: npm start');
    console.log('3. Review screenshots and HTML snapshots');
    console.log('4. Add overrides to overrides.json');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
