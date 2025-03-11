import { Browser, chromium, ElementHandle, Page } from 'playwright';

interface Result { province: string, location: string, quantity: number }

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
  } // You can add any other GPU's into this list from Canada Computers site, and they will just work.
];

// Helper function to check if "Sold Out" is in the innerHTML
const isSoldOut = (innerHtml: string): boolean => {
  return innerHtml.toLowerCase().includes('sold out');
};

const countTotals = async (page: Page): Promise<Result[]> => {
  const results: Result[] = [];

  try {
    // Wait for the modal content to be fully loaded
    await page.waitForSelector('.modal-body', { state: 'attached' });

    // Get all province sections
    const provinceSections: ElementHandle<SVGElement | HTMLElement>[] = await page.$$('.card');

    for (const section of provinceSections) {
      // Get the province name
      const provinceNameElement
        = await section.$('.btn-block');
      if (!provinceNameElement) continue;

      const provinceText: string = await provinceNameElement.innerText();
      const province: string = provinceText.trim();

      // Find all store rows within this province section
      const storeRows: ElementHandle<SVGElement | HTMLElement>[] = await section.$$('.row.mx-0.align-items-center');

      for (const row of storeRows) {
        // Get the store name
        const locationElement = await row.$('.col-3');
        if (!locationElement) continue;

        const location = (await locationElement.innerText()).trim();

        // Get the quantity - we need to check if it has inventory
        const quantityElement = await row.$('.shop-online-box');
        if (!quantityElement) continue;

        const quantityText = (await quantityElement.innerText()).trim();
        const quantity = parseInt(quantityText, 10);

        // Only include stores with stock > 0
        if (quantity > 0) {
          results.push({
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
  const buttonSelector = 'button[data-toggle="collapse"]'; // Selector for the buttons
  const plusIconSelector = 'i.fa-regular.collapse-icon.f-20.position-absolute.right-2.fa-plus'; // The selector for the plus icons
  const results: any[] = [];

  try {
    // Wait for all buttons to be available.
    await page.waitForSelector(buttonSelector, { state: 'attached' });

    // Select all the buttons that toggle the collapses
    const buttons: ElementHandle<SVGElement | HTMLElement>[] = await page.$$(buttonSelector);

    if (buttons.length > 0) {
      // Click on each button sequentially to expand the sections.
      for (const button of buttons) {
        // Click the button to expand the collapse section.
        await button.click();

        // Wait for a small delay to ensure content is loaded/expanded.
        await page.waitForTimeout(500); // Adjust timeout as necessary

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

const logResults = (sku: string, results: Result[]) => {
  console.log(`Results for the following SKU: ${sku}`);
  console.log(`-------------------------------------\n`);
  console.log(results);
  console.log(`-------------------------------------\n`);
};

const ccAvailabilityStore = async () => {
  const availableInBc: any[] = [];

  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  try {
    for (const url of urlLinks) {
      const targetUrl: string = url.targetURL;
      const sku: string = url.sku;

      try {
        console.log(`Parsing: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Now, target the <p> element inside the #storeinfo div
        const innerPElement = await page.$('#storeinfo > div > div > p:nth-child(3)');

        if (!innerPElement) {
          continue;
        }

        // Get the innerHTML of the <p> element
        const innerHtml: string = await innerPElement.innerHTML();

        const soldOutInStore: boolean = isSoldOut(innerHtml)

        if (soldOutInStore) {
          console.log("The product is sold out in store.");
        } else {
          const checkOtherStoresElement = await page.$('span.link-active'); // Selector for "Check Other Stores"

          if (checkOtherStoresElement) {
            await checkOtherStoresElement.click();  // Click the element to open the counts dialog.
            await expandItemTotalDialogue(page);
            const results: Result[]= await countTotals(page)
            logResults(sku, results)
          }
        }

      } catch (error) {
        console.error(`Error processing ${sku}: ${error}`);
      }
    }
  } finally {
    await browser.close(); // Make sure the browser is closed even if errors occur
  }

  if (availableInBc.length > 0) {
    console.log("\nStock Available in British Columbia:");

    for (const result of availableInBc) {
      for (const availability of result.availability) {
        console.log(`- ${availability.location.toLowerCase()} : ${availability.quantity}`);
      }
    }
  } else {
    console.log("No stock available :( tough luck iuri");
  }
};

const runTasks = async (options = {}) => {
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
      await ccAvailabilityStore();
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