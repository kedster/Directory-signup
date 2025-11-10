/**
 * Cloudflare Worker API for Directory Signup Management
 * Provides API endpoints for the GUI to update sites.json and commit to GitHub
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders
  });
}

// Get sites configuration
async function getSites(env) {
  try {
    // In production, this would fetch from GitHub API or KV storage
    // For now, return a placeholder response
    return new Response(JSON.stringify({
      success: true,
      message: 'Fetched sites configuration',
      data: {
        sites: []
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Update sites configuration
async function updateSites(request, env) {
  try {
    const body = await request.json();
    const { sites } = body;
    
    if (!sites || !Array.isArray(sites)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid sites data'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // In production, this would:
    // 1. Validate the sites data
    // 2. Create a commit to GitHub with the updated sites.json
    // 3. Return the commit details
    
    // For now, return a success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Sites configuration updated successfully',
      commit: {
        sha: 'mock-sha',
        message: 'Update sites configuration via GUI'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Update a single site
async function updateSite(request, env, siteId) {
  try {
    const body = await request.json();
    
    // In production, this would:
    // 1. Fetch current sites.json from GitHub
    // 2. Find and update the specific site
    // 3. Commit the changes to GitHub
    
    return new Response(JSON.stringify({
      success: true,
      message: `Site ${siteId} updated successfully`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// List available plugins
async function getPlugins(env) {
  try {
    // In production, this would fetch plugin list from GitHub
    const plugins = [
      {
        name: 'default',
        description: 'Standard form-filling flow for most directory sites',
        active: true
      },
      {
        name: 'producthunt',
        description: 'Custom flow for Product Hunt submissions',
        active: true
      },
      {
        name: 'betalist',
        description: 'Custom flow for BetaList submissions',
        active: true
      }
    ];
    
    return new Response(JSON.stringify({
      success: true,
      data: { plugins }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Trigger Apify actor run
async function triggerApifyRun(request, env) {
  try {
    const body = await request.json();
    const { sites, listings } = body;
    
    // In production, this would trigger an Apify actor run via API
    // using the APIFY_API_TOKEN from env
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Apify actor run triggered',
      runId: 'mock-run-id'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    try {
      // Route requests
      if (path === '/api/sites' && method === 'GET') {
        return await getSites(env);
      }
      
      if (path === '/api/sites' && method === 'PUT') {
        return await updateSites(request, env);
      }
      
      if (path.startsWith('/api/sites/') && method === 'PUT') {
        const siteId = path.split('/').pop();
        return await updateSite(request, env, siteId);
      }
      
      if (path === '/api/plugins' && method === 'GET') {
        return await getPlugins(env);
      }
      
      if (path === '/api/run' && method === 'POST') {
        return await triggerApifyRun(request, env);
      }
      
      // API documentation
      if (path === '/api' || path === '/api/') {
        return new Response(JSON.stringify({
          name: 'Directory Signup Management API',
          version: '1.0.0',
          endpoints: {
            'GET /api/sites': 'Get all sites configuration',
            'PUT /api/sites': 'Update sites configuration',
            'PUT /api/sites/:id': 'Update a specific site',
            'GET /api/plugins': 'List available plugins',
            'POST /api/run': 'Trigger Apify actor run'
          }
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // 404 for unknown routes
      return new Response(JSON.stringify({
        success: false,
        error: 'Not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
