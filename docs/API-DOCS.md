# Crime Map API Documentation

## Incidents API

### GET /api/incidents

Retrieve incidents within a specific geographic area.

**Query Parameters:**
- `lat` (number): Latitude of the center point
- `lng` (number): Longitude of the center point
- `zoom` (number, optional): Zoom level determining the radius of the search area. Default: 12
  - Lower zoom levels (e.g., 5) will search larger areas
  - Higher zoom levels (e.g., 15) will search smaller areas

**Example:**
```
GET /api/incidents?lat=37.7749&lng=-122.4194&zoom=12
```

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "_id": "...",
      "description": "...",
      "address": "...",
      "time": "...",
      "date": "...",
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "latitude": 37.7749,
      "longitude": -122.4194,
      "createdAt": "2023-03-01T00:00:00.000Z",
      "status": "draft",
      "evidenceFiles": [...]
    }
  ]
}
```

### POST /api/incidents

Create a new incident with location data.

**Request Format:**
- Content-Type: `multipart/form-data`

**Form Fields:**
- `description` (string): Description of the incident
- `address` (string): Address or description of the location
- `time` (string): Time of the incident in HH:MM format
- `date` (string): Date of the incident in YYYY-MM-DD format
- `latitude` (number): Latitude coordinate of the incident location
- `longitude` (number): Longitude coordinate of the incident location
- `evidence` (file, optional): Evidence files (images, PDFs, etc.)

**Example:**
```
POST /api/incidents
Content-Type: multipart/form-data

description=Theft of bicycle&address=123 Main St, San Francisco, CA&time=15:30&date=2023-03-01&latitude=37.7749&longitude=-122.4194
```

**Response:**
```json
{
  "success": true,
  "message": "Incident draft created successfully",
  "id": "..."
}
```

## Geocoding API

### GET /api/geocode

Search for an address or place by name.

**Query Parameters:**
- `q` (string): Search query (address, place name, etc.)

**Example:**
```
GET /api/geocode?q=1600+Pennsylvania+Ave,+Washington+DC
```

**Response:**
Contains geocoding results with coordinates and address details.

### POST /api/geocode

Reverse geocode a latitude/longitude pair to an address.

**Request Body:**
```json
{
  "lat": 37.7749,
  "lon": -122.4194
}
```

**Response:**
Contains address information for the provided coordinates.

## Setup API

### GET /api/setup

Initialize the database with required indexes for geospatial queries.

**Example:**
```
GET /api/setup
```

**Response:**
```json
{
  "success": true,
  "message": "Database indexes created successfully"
}
``` 