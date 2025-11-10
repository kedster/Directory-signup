/**
 * Plugin Registry - Manages and loads plugins dynamically
 * 
 * Plugins have access to the ANTICAPTCHA_KEY environment variable
 * for automatic CAPTCHA solving on sites that require it.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.pluginsDir = path.join(__dirname, 'plugins');
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadPlugins() {
    console.log('Loading plugins...');
    
    try {
      const files = await fs.readdir(this.pluginsDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const pluginName = file.replace('.js', '');
          await this.loadPlugin(pluginName);
        }
      }
      
      console.log(`Loaded ${this.plugins.size} plugin(s): ${Array.from(this.plugins.keys()).join(', ')}`);
    } catch (error) {
      console.error('Error loading plugins:', error.message);
      // If plugins directory doesn't exist, that's ok - we'll use default behavior
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load a specific plugin by name
   */
  async loadPlugin(pluginName) {
    try {
      const pluginPath = path.join(this.pluginsDir, `${pluginName}.js`);
      const module = await import(`file://${pluginPath}`);
      const PluginClass = module.default;
      const pluginInstance = new PluginClass();
      
      this.plugins.set(pluginName, pluginInstance);
      console.log(`  ✓ Loaded plugin: ${pluginName}`);
      
      return pluginInstance;
    } catch (error) {
      console.error(`  ✗ Failed to load plugin ${pluginName}:`, error.message);
      return null;
    }
  }

  /**
   * Get a plugin by name, load if not already loaded
   */
  async getPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      await this.loadPlugin(pluginName);
    }
    
    return this.plugins.get(pluginName);
  }

  /**
   * Check if a plugin exists
   */
  hasPlugin(pluginName) {
    return this.plugins.has(pluginName);
  }

  /**
   * Get default plugin
   */
  async getDefaultPlugin() {
    return await this.getPlugin('default');
  }

  /**
   * Process a site with the appropriate plugin
   */
  async processSite(site, page, listing, overrides = {}) {
    // Determine which plugin to use
    let pluginName = site.plugin || 'default';
    
    // If forceDefaultFlow is true, always use default
    if (site.forceDefaultFlow) {
      pluginName = 'default';
    }
    
    // Get the plugin
    let plugin = await this.getPlugin(pluginName);
    
    // Fallback to default if plugin not found
    if (!plugin) {
      console.log(`  ⚠ Plugin '${pluginName}' not found, falling back to default`);
      plugin = await this.getDefaultPlugin();
    }
    
    // Process the site with the plugin
    return await plugin.process(page, site, listing, overrides);
  }
}

// Export singleton instance
export default new PluginRegistry();
