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
    // Fetch sites.json from GitHub
    const owner = env.GITHUB_OWNER || 'kedster';
    const repo = env.GITHUB_REPO || 'Directory-signup';
    const branch = env.GITHUB_BRANCH || 'main';
    const githubToken = env.GITHUB_TOKEN;
    
    // Construct GitHub API URL for raw file content
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sites.json?ref=${branch}`;
    
    const headers = {
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3.raw'
    };
    
    // Add auth header if token is available
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    const response = await fetch(githubApiUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const sitesData = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Fetched sites configuration',
      data: sitesData
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
    
    // Validate GitHub token is available
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GitHub token not configured. Please set GITHUB_TOKEN secret.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const owner = env.GITHUB_OWNER || 'kedster';
    const repo = env.GITHUB_REPO || 'Directory-signup';
    const branch = env.GITHUB_BRANCH || 'main';
    
    // Step 1: Get current file to retrieve its SHA
    const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sites.json?ref=${branch}`;
    const getFileResponse = await fetch(getFileUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!getFileResponse.ok) {
      throw new Error(`Failed to get current file: ${getFileResponse.status}`);
    }
    
    const currentFile = await getFileResponse.json();
    const currentSha = currentFile.sha;
    
    // Step 2: Create updated content
    const updatedContent = JSON.stringify({ sites }, null, 2);
    const base64Content = btoa(updatedContent);
    
    // Step 3: Commit the changes
    const updateFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sites.json`;
    const updateFileResponse = await fetch(updateFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update sites configuration via Management GUI',
        content: base64Content,
        sha: currentSha,
        branch: branch
      })
    });
    
    if (!updateFileResponse.ok) {
      const errorData = await updateFileResponse.json();
      throw new Error(`Failed to update file: ${errorData.message || updateFileResponse.statusText}`);
    }
    
    const commitData = await updateFileResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sites configuration updated successfully',
      commit: {
        sha: commitData.commit.sha,
        message: commitData.commit.message,
        url: commitData.commit.html_url
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
