const { MongoClient } = require('mongodb');

// 🧠 Replace this with your Atlas connection URI
const atlasUri = 'mongodb+srv://amalskumar20:EqtAscyTZmj0trPU@ecommerce-cluster.l3l9cyq.mongodb.net';
const atlasDbName = 'obscura_shop';

// 👇 This is your local MongoDB URI
const localUri = 'mongodb://127.0.0.1:27017';
const localDbName = 'mymvcproject';

async function migrateData() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    await localClient.connect();
    await atlasClient.connect();

    console.log('🔗 Connected to both Local MongoDB and Atlas');

    const localDb = localClient.db(localDbName);
    const atlasDb = atlasClient.db(atlasDbName);

    const collections = await localDb.listCollections().toArray();

    for (const { name: collectionName } of collections) {
      console.log(`➡️ Migrating "${collectionName}"...`);
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);

      const docs = await localCollection.find({}).toArray();

      if (docs.length > 0) {
        await atlasCollection.insertMany(docs);
        console.log(`   ✅ Migrated ${docs.length} documents from "${collectionName}"`);
      } else {
        console.log(`   ⚠️ No documents in "${collectionName}", skipping`);
      }
    }

    console.log('🎉 All data migrated from local to Atlas');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateData();
