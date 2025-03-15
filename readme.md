# Canada Computers GPU Stock Checker API

A NestJS API service that tracks and monitors GPU stock availability across Canada Computers stores in real-time.
## Features

- **Organized Results:** Data is structured by province, location, and SKU
- **RESTful API**: Access stock information through HTTP endpoints.
- **Dynamic GPU Tracking**: Add or retrieve GPU models/skus through API endpoints.
- **Detailed Availability**: Shows exact quantities at each retail location.

## Video Demo

https://github.com/user-attachments/assets/9f1481a7-b516-4b86-9a34-4e6c8e63bb19

## Architecture
The project follows a modular NestJS architecture with clean separation of concerns:

* **Controller Layer**: Handles HTTP requests and route management from the client.
* **Service Layer**: Contains business logic with specialized services:
    * Browser automation service (using Playwright).
    * Web scraping service (using Cheerio for faster performance).
    * Network request service (handles all HTTP communications).
* **Persistence Layer**: Manages stored GPU data through dependency injection. Will eventually interface with DuckDB and a model/data persistence layer soon.
* **Module Structure**: Organizes related components into cohesive feature modules.
* **Dependency Injection**: Promotes code reuse and testability through an IoC pattern.
* **Error Handling**: Proper HTTP status codes and detailed error messages.
* **Logging**: Comprehensive logging across all services for debuggability.

### Key Services

1. **NetworkRequestService**: Centralizes all HTTP requests with proper headers and rate limiting.
2. **UrlLinksPersistenceService**: Manages the in-memory storage of tracked GPUs.
3. **LoadGPUsWebScrapedService**: Handles individual GPU scraping using Cheerio.
4. **LoadAllGPUsWebScrapedService**: Coordinates batch scraping of all tracked GPUs.
5. **GpuStockCheckerServiceBrowserAutomation**: Legacy service using Playwright for complex interactions.

This architecture enables:
* **Code Reuse**: Common functionality extracted into specialized services
* **Performance Optimization**: Faster scraping through Cheerio instead of browser automation
* **Maintainability**: Single responsibility principle applied to all components
* **Scalability**: Easy to add new features or data sources

## API Testing with Postman

This repository includes a Postman collection for easy API testing.

![image](https://github.com/user-attachments/assets/baec16bd-d82b-4950-967e-21175a39902b)

### Importing the Collection

1. Download the Postman collection file from:
   `./postman/Canada-Computers-GPU-Checker.postman_collection.json`
2. Open Postman.
3. Click "Import" button in the top left corner.
4. Drag and drop the downloaded JSON file or browse to select it.
5. The collection will be imported with all pre-configured requests.

### Available Requests

The collection includes the following endpoints:

- **GET `/gpus`** - Get real-time availability for all tracked GPUs using browser automation with Playwright (slow).
- **GET `/gpus/scraped`** - Get availability for all tracked GPUs using optimized web scraping (fast + optimized).
- **POST `/gpus/scraped`** - Check availability for a specific individual GPU using optimized web scraping (fast + optimized).

  
  **Request body:**
  ```json
   {
     "url": "https://www.canadacomputers.com/en/powered-by-amd/258168/asrock-radeon-rx-7800-xt-challenger-16gb-oc-rx7800xt-cl-16go.html",
     "sku": "ASROCK Radeon RX 7800 XT Challenger 16GB OC"
   }
  ```

- **POST `/gpus`** - Add a new single GPU to be tracked by the application.


  **Request body:**
  ```json
  {
    "url": "https://www.canadacomputers.com/en/powered-by-amd/251687/gigabyte-radeon-rx-7600-xt-gaming-oc-16g-gv-r76xtgaming-oc-16gd.html",
    "sku": "GIGABYTE Radeon RX 7600 XT GAMING OC 16G Graphics Card, 3x WINDFORCE Fans 16GB 128-bit GDDR6, GV-R76XTGAMING OC-16GD Video Card"
  }
  ```

- **POST `/gpus/tracked`** - Retrieve a list of all the tracked GPU's by the application.
- **GET `/gpus/all`** - Scrapes and loads all available GPUs from Canada Computers website into the application's memory
    - **Query Parameters:**
        - `maxPages` (optional): Number of catalog pages to scrape (default: 5).
        - Example: `/gpus/all?maxPages=1` (scrapes only the first page of GPU listings).
    - **Response:**
      ```json
      {
        "message": "GPUs were loaded into the app successfully",
        "pagesScanned": 1
      }
      ```
    - **Notes:**
        - Higher `maxPages` values will take longer to complete but will find more GPU models.
        - This operation must be performed before checking availability to populate the GPU database when I eventually bring in DuckDB.

### Environment Setup

For local testing, create an environment in Postman with the variable:
- `baseUrl`: `http://localhost:3000`

## API Endpoints

#### Check GPU Availability

Returns real-time stock information for all tracked GPUs, organized by province, location, and SKU.
````
GET /gpus
````
Expected 201 (Success) response body:

```json
{
  "Ontario": {
    "Waterloo": {
      "MSI GeForce RTX 5080 16GB Suprim SOC GDDR7": {
        "sku": "MSI GeForce RTX 5080 16GB Suprim SOC GDDR7",
        "province": "Ontario",
        "location": "Waterloo",
        "quantity": 1
      },
      "ASUS Prime Radeon RX 9070 OC Edition 16GB GDDR6": {
        "sku": "ASUS Prime Radeon RX 9070 OC Edition 16GB GDDR6",
        "province": "Ontario",
        "location": "Waterloo",
        "quantity": 4
      }
    },
    "Toronto": {
      "...": {} // Etc...
    }
  },
  "Quebec": {
    "...": {} // Etc...
  }
}
```

Returns a list of all GPUs currently being tracked by the system.
````
GET /gpus/tracked
````
Adds a new GPU to the tracking system.
````
POST /gpus
````

Request body:

```json
{
  "targetURL": "https://www.canadacomputers.com/en/powered-by-nvidia/[product-url]",
  "sku": "Descriptive GPU SKU Name"
}
```

Expected 201 (Success) response body:

```json
{
  "message": "GPU added successfully",
  "sku": "Descriptive GPU SKU Name"
}
```


## Prerequisites

- Node.js (v16 or later).
- npm (v7 or later).
- NestJS CLI (optional, for development).

## Setup Guide

### Installation:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/canada-computers-gpu-checker.git
cd canada-computers-gpu-checker
```
2. Install dependencies:
```bash
npm install 
```
3. Install Playwright browsers:
```json
npx playwright install chromium
```

## Running the API

Start the NestJS server:

```bash
npm run start
```

For development with auto-reload:

```bash
npm run start:dev
```
## Technical Implementation

The project has been restructured to follow NestJS patterns:

1. **Controller** (`gpu.controller.ts`): Handles HTTP requests, input validation, and response formatting.
2. **Service** (`gpu-stock-checker.service.ts`): Contains core scraping logic, GPU tracking, and result processing.
3. **Interfaces**: Type definitions for the stock availability data structure.


## **Key Components**
- **Web Scraping**: Uses Playwright to navigate and extract data from Canada Computers website.
- **API Endpoints**: RESTful HTTP endpoints for interacting with the service.
- **Error Handling**: Provides appropriate HTTP status codes and error messages.
- **Logging**: Comprehensive logging of scraping activities and errors.

## Customization
Create a `.env` file to customize the application behavior:

```dotenv
PORT=3000
HEADLESS_MODE=true
CHECK_INTERVAL=300000
```

## Future Development

While this roadmap is ambitious and comprehensive, even implementing a third of these features would provide significant learning opportunities for me. The journey of building these components will involve exploring new technologies, solving interesting problems, and creating something genuinely useful for GPU nerds like myself.

### Interactive Frontend Interface
- Build a responsive React single-page application with a real-time GPU availability dashboard.
- Support mobile devices for checking stock on-the-go.
- Implement interactive maps showing stock availability relative to user location.
- Develop some customizable alert systems for price and quantity thresholds.
- Display historical availability and pricing trends with interactive charts (ShadCN UI Charts).

### Comprehensive Product Database
- Create some sort of automatic crawler that indexes the entire Canada Computers GPU catalog.
- Implement DuckDB for efficient storage of product and price history data.
- Use web scraping practices (delayed requests, request limits, rotating IPs) to avoid me getting rekt/blocked.
- Build an admin dashboard to monitor data collection health and performance.

### Multi-Retailer Comparison Tools
- Expand data collection to include Memory Express, Newegg, Best Buy, and Amazon.
- Track price history across retailers with configurable price drop alerts.
- Provide a unified search interface across all active retailers with filtering by model and specifications.
- Develop some sort of deal-ranking system based on the price and the availability of a specific GPU via it's SKU.

### Global Availability Support
- Support multiple regions including Canada and Australia.
- Integrate popular retailers in each region (PC Case Gear, Scorptec for Australia).
- Offer currency conversion for straightforward price comparisons (AUD vs CAD).
- Optimize data collection to accommodate regional differences.

### User Personalization
- Implement secure authentication with social login integration.
- Allow users to create and manage GPU watchlists.
- Provide multiple notification options (email, SMS, browser push).
- Enable sharing availability alerts with others.
- Create some sort of engagement/achievement system to reward active users for (this one feels a bit crack like lmao).
