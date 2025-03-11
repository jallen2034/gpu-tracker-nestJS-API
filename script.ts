import { Browser, chromium, ElementHandle, Page } from 'playwright';

const urlLinks: any = [
  {
    "targetURL": "https://www.canadacomputers.com/en/powered-by-nvidia/268153/zotac-gaming-geforce-rtx-5080-solid-oc-16gb-gddr7-zt-b50800j-10p.html",
    "sku": "ZOTAC GAMING RTX 5080 Solid OC 16GB GDDR7"
  },
  {
    "targetURL": "https://www.canadacomputers.com/en/powered-by-nvidia/268152/zotac-gaming-geforce-rtx-5080-solid-16gb-gddr7-zt-b50800d-10p.html",
    "sku": "ZOTAC GAMING RTX 5080 Solid 16GB GDDR7"
  },
  {
    "targetURL": "https://www.canadacomputers.com/en/powered-by-nvidia/267620/msi-geforce-rtx-5080-16g-suprim-soc-gddr7-16gb-rtx-5080-16g-suprim-soc.html",
    "sku": "MSI GeForce RTX 5080 16GB Suprim SOC GDDR7"
  },
  {
    "targetURL": "https://www.canadacomputers.com/en/powered-by-amd/267255/asus-prime-radeon-rx-9070-oc-edition-16gb-gddr6prime-rx9070-o16g-prime-rx9070-o16g.html",
    "sku": "ASUS Prime Radeon RX 9070 OC Edition 16GB GDDR6PRIME-RX9070-O16G"
  },
];

// Base result returned from scraping.
interface Result {
  sku: string;
  province: string;
  location: string;
  quantity: number;
}

// Maps SKUs to their Result objects at a specific location.
interface SkuMap {
  [skuName: string]: Result;
}

// Maps locations to their available SKUs.
interface LocationMap {
  [locationName: string]: SkuMap;
}

// The complete response structure.
interface StockAvailabilityResponse {
  [provinceName: string]: LocationMap;
}

// Helper function to check if "Sold Out" is in the innerHTML
const isSoldOut = (innerHtml: string): boolean => {
  return innerHtml.toLowerCase().includes('sold out');
};

const countTotals = async (page: Page, sku: string): Promise<Result[]> => {
  const results: Result[] = [];

  try {
    // Wait for the modal content to be fully loaded
    await page.waitForSelector('.modal-body', { state: 'attached' });

    // Get all province sections.
    const provinceSections: ElementHandle<SVGElement | HTMLElement>[] = await page.$$('.card');

    for (const section of provinceSections) {
      // Get the province name.
      const provinceNameElement
        = await section.$('.btn-block');
      if (!provinceNameElement) continue;

      const provinceText: string = await provinceNameElement.innerText();
      const province: string = provinceText.trim();

      // Find all store rows within this province section.
      const storeRows: ElementHandle<SVGElement | HTMLElement>[] = await section.$$('.row.mx-0.align-items-center');

      for (const row of storeRows) {
        // Get the store name.
        const locationElement = await row.$('.col-3');
        if (!locationElement) continue;

        const location: string = (await locationElement.innerText()).trim();

        // Get the quantity - we need to check if it has inventory.
        const quantityElement = await row.$('.shop-online-box');
        if (!quantityElement) continue;

        const quantityText: string = (await quantityElement.innerText()).trim();
        const quantity: number = parseInt(quantityText, 10);

        // Only include stores with stock > 0
        if (quantity > 0) {
          results.push({
            sku,
            province,
            location,
            quantity
          });
        }
      }
    }

    console.log(`Total locations with stock: ${results.length}`);
    return results;
  } catch (error) {
    console.error('Error in countTotals:', error);
    return [];
  }
}

const expandItemTotalDialogue = async (page: Page): Promise<any[]> => {
  const buttonSelector: string = 'button[data-toggle="collapse"]'; // Selector for the buttons
  const plusIconSelector: string = 'i.fa-regular.collapse-icon.f-20.position-absolute.right-2.fa-plus'; // The selector for the plus icons
  const results: any[] = [];

  try {
    // Wait for all buttons to be available.
    await page.waitForSelector(buttonSelector, { state: 'attached' });

    // Select all the buttons that toggle the collapses
    const buttons: ElementHandle<SVGElement | HTMLElement>[] = await page.$$(buttonSelector);

    if (buttons.length > 0) {
      // Click on each button sequentially to expand the sections.
      for (const button of buttons) {
        await button.click();
        await page.waitForTimeout(500);

        // After expanding the collapse, click the plus icon if it exists.
        const plusIcon: any = await button.$(plusIconSelector);

        if (plusIcon) {
          await plusIcon.click();
        }

        await page.waitForTimeout(500); // Adjust timeout as necessary for the expand action
      }
    }

    return results;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const displayResults = (allResults: Result[][]): StockAvailabilityResponse => {
  const hasResults: boolean = allResults.some((
    resultArr: Result[]): boolean => resultArr.length > 0
  );

  if (!hasResults) {
    console.log("No stock available :( tough luck iuri");
    return {} as StockAvailabilityResponse;
  }

  const finalResult: StockAvailabilityResponse = {}

  // Build unique list of provinces GPU's were found at.
  allResults.forEach((results: Result[]) => {
    results.forEach((result: Result) => {
      // Initialize a province if needed in our final result.
      if (!(result.province in finalResult)) {
        finalResult[result.province] = {};
      }

      // Initialize location if needed.
      if (!(result.location in finalResult[result.province])) {
        finalResult[result.province][result.location] = {};
      }

      // Add the current GPU by SKU to avoid overwriting.
      finalResult[result.province][result.location][result.sku] = result;
    })
  })

  return finalResult
}

const ccAvailabilityStore = async (): Promise<StockAvailabilityResponse> => {
  const availableInBc: Result[][] = [];
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  try {
    for (const url of urlLinks) {
      const targetUrl: string = url.targetURL;
      const sku: string = url.sku;

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Now, target the <p> element inside the #storeinfo div
        const innerPElement = await page.$('#storeinfo > div > div > p:nth-child(3)');

        if (!innerPElement) {
          continue;
        }

        // Get the innerHTML of the <p> element
        const innerHtml: string = await innerPElement.innerHTML();
        const soldOutInStore: boolean = isSoldOut(innerHtml);

        if (!soldOutInStore) {
          const checkOtherStoresElement = await page.$('span.link-active'); // Selector for "Check Other Stores"

          if (checkOtherStoresElement) {
            await checkOtherStoresElement.click();  // Click the element to open the counts dialog.
            await expandItemTotalDialogue(page);
            const results: Result[]= await countTotals(page, sku);
            availableInBc.push(results);
          }
        }
      } catch (error) {
        console.error(`Error processing ${sku}: ${error}`);
      }
    }
  } finally {
    await browser.close(); // Make sure the browser is closed even if errors occur
  }

  // Use the new display function
  return displayResults(availableInBc);
};

const runTasks = async () => {
  const maxRuns = 1;
  let runCount: number = 0;

  // Setup proper exit handling.
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    process.exit(0);
  });

  while (runCount < maxRuns) {
    try {
      console.log("------------- Running tasks ----------------");
      const finalAPIResponse: StockAvailabilityResponse = await ccAvailabilityStore();
      console.log("Response JSON from scraper");
      console.log(JSON.stringify(finalAPIResponse, null, 2));
      console.log("------------- End of batch ----------------");
    } catch (error) {
      console.error(`Error in runTasks: ${error}`);
    }

    runCount++;
  }

  console.log("Task runner complete");
};

// Only run if this file is being executed directly
if (require.main === module) {
  runTasks().catch(console.error);
}