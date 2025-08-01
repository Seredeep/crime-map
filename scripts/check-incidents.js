const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crime-map';
const DATABASE_NAME = 'crime-map';
const COLLECTION_NAME = 'incident_draft';

async function checkAndCreateIncidents() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Verificar si hay incidentes
    const count = await collection.countDocuments();
    console.log(`📊 Total incidents in database: ${count}`);

    if (count === 0) {
      console.log('⚠️ No incidents found, creating sample incidents...');

      const sampleIncidents = [
        {
          description: 'Robo en vivienda en Avenida Luro 1234',
          address: 'Avenida Luro 1234, Mar del Plata, Argentina',
          time: '14:30',
          date: '2024-01-15',
          location: {
            type: "Point",
            coordinates: [-57.5426, -38.0055]
          },
          createdAt: new Date(),
          status: 'verified',
          tags: ['robo', 'vivienda'],
          type: 'robo',
          evidenceFiles: [],
          createdBy: 'admin'
        },
        {
          description: 'Asalto en la esquina de Avenida Colón y San Martín',
          address: 'Avenida Colón y San Martín, Mar del Plata, Argentina',
          time: '20:15',
          date: '2024-01-14',
          location: {
            type: "Point",
            coordinates: [-57.5526, -38.0155]
          },
          createdAt: new Date(),
          status: 'verified',
          tags: ['asalto', 'esquina'],
          type: 'asalto',
          evidenceFiles: [],
          createdBy: 'admin'
        },
        {
          description: 'Vandalismo en parque público',
          address: 'Parque San Martín, Mar del Plata, Argentina',
          time: '23:45',
          date: '2024-01-13',
          location: {
            type: "Point",
            coordinates: [-57.5326, -37.9955]
          },
          createdAt: new Date(),
          status: 'verified',
          tags: ['vandalismo', 'parque'],
          type: 'vandalismo',
          evidenceFiles: [],
          createdBy: 'admin'
        },
        {
          description: 'Hurto de vehículo en estacionamiento',
          address: 'Estacionamiento Shopping Los Gallegos, Mar del Plata, Argentina',
          time: '16:20',
          date: '2024-01-12',
          location: {
            type: "Point",
            coordinates: [-57.5626, -38.0255]
          },
          createdAt: new Date(),
          status: 'verified',
          tags: ['hurto', 'vehiculo'],
          type: 'hurto',
          evidenceFiles: [],
          createdBy: 'admin'
        },
        {
          description: 'Actividad sospechosa en calle Güemes',
          address: 'Calle Güemes 567, Mar del Plata, Argentina',
          time: '22:30',
          date: '2024-01-11',
          location: {
            type: "Point",
            coordinates: [-57.5226, -37.9855]
          },
          createdAt: new Date(),
          status: 'verified',
          tags: ['sospechoso', 'calle'],
          type: 'actividad sospechosa',
          evidenceFiles: [],
          createdBy: 'admin'
        }
      ];

      const result = await collection.insertMany(sampleIncidents);
      console.log(`✅ Created ${result.insertedCount} sample incidents`);

      // Verificar que se crearon correctamente
      const newCount = await collection.countDocuments();
      console.log(`📊 New total incidents: ${newCount}`);

    } else {
      console.log('✅ Incidents already exist in database');

      // Mostrar algunos incidentes existentes
      const incidents = await collection.find({}).limit(3).toArray();
      console.log('📋 Sample incidents:');
      incidents.forEach((incident, index) => {
        console.log(`  ${index + 1}. ${incident.description} (${incident.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndCreateIncidents();
