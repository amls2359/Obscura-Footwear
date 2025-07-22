const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://amalskumar20:EqtAscyTZmj0trPU@ecommerce-cluster.l3l9cyq.mongodb.net';

const sourceDBName = 'mymvc';
const targetDBName = 'obscura_shop';

async function migrateData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const sourceDB = client.db(sourceDBName);
    const targetDB = client.db(targetDBName);

    const collections = await sourceDB.listCollections().toArray();

    for (const { name: collectionName } of collections) {
      const sourceCollection = sourceDB.collection(collectionName);
      const targetCollection = targetDB.collection(collectionName);

      const docs = await sourceCollection.find({}).toArray();

      if (docs.length > 0) {
        await targetCollection.insertMany(docs);
        console.log(`✅ Migrated ${docs.length} documents from "${collectionName}"`);
      } else {
        console.log(`ℹ️ No documents found in "${collectionName}"`);
      }
    }

    console.log('🎉 Data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateData();
