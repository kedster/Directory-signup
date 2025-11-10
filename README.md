# Directory-signup

Automate SaaS listing directory signups using Puppeteer. This tool helps you submit your product to multiple directory websites efficiently.

## Features

- 🚀 Process 50 directory sites automatically
- 🔄 Concurrent processing (5 sites at a time)
- 📸 Automatic screenshot capture on failures
- 📄 HTML snapshot saving for debugging
- 🎯 Site-specific selector overrides
- 📊 Detailed reporting and results tracking

## Installation

```bash
npm install
```

## Usage

1. **First Run** - The script will process all sites and identify which ones need custom selectors:

```bash
npm start
```

2. **Review Failures** - After the first run, check the generated folders:
   - `screenshots/` - Contains screenshots of each page
   - `html_snapshots/` - Contains HTML source of each page

3. **Add Overrides** - For each failed site, inspect the screenshot and HTML to find the correct selectors, then add them to `overrides.json`:

```json
{
  "producthunt.com": {
    "selectors": {
      "emailInput": "#email",
      "passwordInput": "#password",
      "companyNameInput": "#company-name",
      "websiteInput": "#website",
      "submitButton": "button[type='submit']"
    },
    "waitForSelector": ".success-message",
    "customSteps": []
  }
}
```

4. **Run Again** - Process sites again with the new overrides:

```bash
npm start
```

## Configuration

### sites.json

Contains the list of directory sites to process. Each entry has:
- `name` - Display name of the directory
- `startUrl` - URL to the signup/submission page

### overrides.json

Contains site-specific configurations:
- `selectors` - CSS selectors for form fields
- `waitForSelector` - Selector to wait for after submission
- `customSteps` - Array of custom actions (future feature)

## File Structure

```
.
├── index.js              # Main automation script
├── sites.json            # List of 50 directory sites
├── overrides.json        # Site-specific selector overrides
├── package.json          # Node.js dependencies
├── screenshots/          # Generated screenshots (gitignored)
├── html_snapshots/       # Generated HTML files (gitignored)
└── results.json          # Detailed results log
```

## Process Flow

1. Script loads sites from `sites.json`
2. Processes 5 sites concurrently
3. For each site:
   - Navigates to the startUrl
   - Checks for site-specific overrides
   - If overrides exist, applies custom selectors
   - If no overrides, saves screenshot and HTML for inspection
4. Generates summary report with:
   - Success count
   - Sites needing overrides
   - Failed sites with error details

## Expected Workflow

This tool is designed for iterative refinement:

1. **Initial Run**: Expect many failures - this is normal! The script will save screenshots and HTML for each failure.

2. **Inspection**: Open the saved screenshots and HTML files to understand each site's structure.

3. **Override Creation**: For each failed site, create an entry in `overrides.json` with exact selectors.

4. **Iteration**: Run the script again. Success rate will improve with each iteration.

5. **Repeat**: Continue until all sites are configured or you've covered your priority sites.

## Tips

- Start with 5-10 sites to test the process
- Use browser DevTools to find exact selectors
- Some sites may require login or have bot protection
- Consider adding delays or custom steps for complex forms
- Check `results.json` for detailed information about each run

## Requirements

- Node.js 14+
- npm or yarn

## License

MIT