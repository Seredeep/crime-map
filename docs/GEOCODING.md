# Geocoding with Pelias in Crime Map Application

This document describes how to set up and use the Pelias geocoding service in the Crime Map application, specifically tailored for the Mar Del Plata / General Pueyrredón region.

## What is Pelias?

[Pelias](https://github.com/pelias/pelias) is an open-source, distributed, geographic search engine built on top of Elasticsearch. It's designed to quickly geocode addresses and places to geographic coordinates and vice versa.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js and npm (for the Next.js application)

### Step 1: Set up the Pelias Docker Environment

1. Clone the repository from this project's pelias directory:

```bash
cd pelias
git clone https://github.com/pelias/docker.git
cd docker
./setup.sh
```

2. Navigate to the Mar Del Plata project:

```bash
cd projects/mar-del-plata
```

3. Start the Pelias services:

```bash
docker-compose up
```

This will download the necessary data for the Mar Del Plata region and set up all required services. The first run might take some time as it downloads and processes data.

### Step 2: Testing the Pelias API

Once all services are running, you can test the Pelias API:

```bash
curl http://localhost:4000/v1/search?text=Avenida+Luro+Mar+del+Plata
```

This should return JSON with geocoding results for that address.

## Using the Geocoding API in the Application

The application includes a geocoding API endpoint at `/api/geocode` that communicates with the Pelias server. There are also helper functions in `src/lib/geocoding.ts` to interact with this API.

### Forward Geocoding (Address to Coordinates)

Use the `geocodeAddress` function to convert addresses to coordinates:

```typescript
import { geocodeAddress } from '@/lib/geocoding';

const handleSearch = async (address: string) => {
  try {
    const response = await geocodeAddress(address);
    const firstResult = response.features[0];
    const [longitude, latitude] = firstResult.geometry.coordinates;
    
    console.log(`Coordinates: ${latitude}, ${longitude}`);
  } catch (error) {
    console.error('Geocoding error:', error);
  }
};
```

### Reverse Geocoding (Coordinates to Address)

Use the `reverseGeocode` function to convert coordinates to an address:

```typescript
import { reverseGeocode } from '@/lib/geocoding';

const handleReverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const response = await reverseGeocode(latitude, longitude);
    const firstResult = response.features[0];
    
    console.log(`Address: ${firstResult.properties.label}`);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
};
```

### Using the GeocodeSearch Component

The application includes a `GeocodeSearch` component that provides a search box with autocomplete functionality:

```tsx
import GeocodeSearch from '@/app/components/GeocodeSearch';
import { GeocodingResult } from '@/lib/geocoding';

export default function MyPage() {
  const handleLocationSelect = (result: GeocodingResult) => {
    const [longitude, latitude] = result.geometry.coordinates;
    console.log(`Selected location: ${result.properties.label}`);
    console.log(`Coordinates: ${latitude}, ${longitude}`);
  };

  return (
    <div>
      <h1>Find a location</h1>
      <GeocodeSearch onLocationSelect={handleLocationSelect} />
    </div>
  );
}
```

## API Endpoints

### Forward Geocoding

```
GET /api/geocode?q=your+address+here
```

Query Parameters:
- `q`: The address or place to geocode (required)

### Reverse Geocoding

```
POST /api/geocode
```

Request Body:
```json
{
  "lat": -38.0123,
  "lon": -57.5312
}
```

Both endpoints return geocoding results in GeoJSON format with properties like name, street, locality, etc.

## Limiting Results to Mar Del Plata

The API has been configured with a bounding box around Mar Del Plata to prioritize local results. This improves search accuracy for local streets and landmarks. 