import clientPromise from './mongodb';

/**
 * Creates a 2dsphere index on the location field in the incident_draft collection
 * This index is required for geospatial queries like $geoWithin
 */
export async function createGeoSpatialIndex() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // First, check if the collection exists
    const collections = await db.listCollections({ name: 'incident_draft' }).toArray();
    
    // If collection doesn't exist, create it with a dummy document and then delete it
    if (collections.length === 0) {
      console.log('Collection incident_draft does not exist, creating it...');
      // Insert a temporary document to create the collection
      const tempDoc = { _temp: true, createdAt: new Date() };
      await db.collection('incident_draft').insertOne(tempDoc);
      // Remove the temporary document
      await db.collection('incident_draft').deleteOne({ _temp: true });
      console.log('Created incident_draft collection');
    }
    
    // Now create the index
    // Check if the index already exists
    const indexExists = await db.collection('incident_draft').indexExists('location_2dsphere');
    
    if (!indexExists) {
      // Create a 2dsphere index on the location field
      await db.collection('incident_draft').createIndex(
        { location: '2dsphere' },
        { name: 'location_2dsphere' }
      );
      console.log('Created 2dsphere index on location field in incident_draft collection');
    } else {
      console.log('2dsphere index already exists on location field');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating geospatial index:', error);
    return { success: false, error };
  }
} 