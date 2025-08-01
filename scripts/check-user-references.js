// scripts/check-user-references.js
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    // 1. Obtener todos los _id de users como string
    const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
    const userIds = new Set(users.map(u => u._id.toString()));

    // 2. Obtener todos los accounts
    const accounts = await db.collection('accounts').find({}, { projection: { _id: 1, userId: 1 } }).toArray();

    // 3. Filtrar los no referenciados
    const noReferenciados = accounts.filter(acc => {
      const accUserId = acc.userId?.toString?.() || acc.userId;
      return !userIds.has(accUserId);
    });

    if (noReferenciados.length === 0) {
      console.log('No hay accounts no referenciados para eliminar.');
      return;
    }

    // 4. Eliminar los no referenciados
    const idsAEliminar = noReferenciados.map(acc => acc._id);
    const result = await db.collection('accounts').deleteMany({ _id: { $in: idsAEliminar } });

    console.log(`Eliminados ${result.deletedCount} accounts no referenciados.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
