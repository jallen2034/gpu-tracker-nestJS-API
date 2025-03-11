# Canada Computers GPU Stock Checker

A TypeScript application using Playwright to automatically check stock availability for GPUs across Canada Computers stores.

## Features

- Monitors GPU stock for multiple SKUs in real-time.
- Checks availability across all Canada Computers stores.
- Provides detailed output for each location with available stock.
- Easy to configure with additional GPU models.

## Prerequisites

- Node.js (v16 or later).
- npm (v7 or later).

## Setup Guide

### Initial Setup

1. Create a new directory for your project:
   ```bash
   mkdir canada-computers-gpu-checker
   cd canada-computers-gpu-checker
   ```

2. Create the project structure:
   ```bash
   mkdir -p src
   ```

3. Initialize npm project:
   ```bash
   npm init -y
   ```

4. Install dependencies:
   ```bash
   npm install playwright
   npm install --save-dev @types/node ts-node typescript prettier
   ```

5. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

## Running the Application

Run the application with:

```bash
npm start
```

## Usage

The script will:
1. Launch a Chromium browser
2. Visit each configured GPU page
3. Check if the item is in stock in-store
4. If available, click "Check Other Stores" and parse all location data
5. Display detailed stock information for all locations

## Output

The script provides detailed console output:

```
------------- Running tasks ----------------
Parsing: https://www.canadacomputers.com/en/powered-by-nvidia/268153/zotac-gaming-geforce-rtx-5080-solid-oc-16gb-gddr7-zt-b50800j-10p.html
Total locations with stock: 14
Results for the following SKU: ZOTAC GAMING RTX 5080 Solid OC 16GB GDDR7
-------------------------------------

[
  { province: 'Ontario', location: 'Waterloo', quantity: 4 },
  { province: 'Ontario', location: 'Barrie', quantity: 3 },
  { province: 'Ontario', location: 'Cambridge', quantity: 1 },
  ...
]
-------------------------------------

------------- End of batch ----------------
Task runner complete
```

## Customization

### Continuous Monitoring

To run the script continuously and check for stock at regular intervals, modify the `runTasks` function:

```typescript
const runTasks = async (options = {}) => {
  // Change to run indefinitely
  let running = true;

  // Setup proper exit handling.
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    running = false;
    process.exit(0);
  });

  while (running) {
    try {
      console.log("------------- Running tasks ----------------");
      await ccAvailabilityStore();
      console.log("------------- End of batch ----------------");
    } catch (error) {
      console.error(`Error in runTasks: ${error}`);
    }

    console.log("Waiting for the next check...");
    // Add sleep between runs (e.g., 5 minutes = 300000ms)
    await new Promise(resolve => setTimeout(resolve, 300000));
  }
};
```

### Headless Mode

To run the browser in headless mode (no visible browser window), modify:

```typescript
const browser: Browser = await chromium.launch({ headless: false });
```

to:

```typescript
const browser: Browser = await chromium.launch({ headless: true });
```

## Troubleshooting

### Common Issues

1. **Browser launch fails**
    - Make sure you've installed Playwright browsers with `npx playwright install chromium`
    - Try running with explicit path: `PLAYWRIGHT_BROWSERS_PATH=0 npm start`

2. **TypeScript errors**
    - Check your imports and interfaces
    - Make sure you're using TypeScript syntax correctly

3. **Selector errors**
    - Website structure might have changed
    - Debug with `console.log` or use Playwright's debugging tools

## License

This project is licensed under the MIT License.