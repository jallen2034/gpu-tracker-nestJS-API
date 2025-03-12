# Canada Computers GPU Stock Checker API

A NestJS API service that tracks and monitors GPU stock availability across Canada Computers stores in real-time.
## Features

- **Organized Results:** Data is structured by province, location, and SKU
- **RESTful API**: Access stock information through HTTP endpoints.
- **Dynamic GPU Tracking**: Add or retrieve GPU models/skus through API endpoints.
- **Detailed Availability**: Shows exact quantities at each retail location.

## Architecture
The project has been migrated from a standalone script to a full NestJS API service:

- **Controller Layer**: Handles HTTP requests and route management from the client.
- **Service Layer**: Contains business logic and scraping functionality with Playwright.
- **Error Handling:** Proper HTTP status codes and error messages.

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
3. **DTOs**: Define the structure of request/response data.
4. **Interfaces**: Type definitions for the stock availability data structure.


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
