const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://amalskumar20:EqtAscyTZmj0trPU@ecommerce-cluster.l3l9cyq.mongodb.net';

const sourceDBName = 'mymvcproject';
const targetDBName = 'obscura_shop';

async function migrateData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const sourceDB = client.db(sourceDBName);
    const targetDB = client.db(targetDBName);

    const collections = await sourceDB.listCollections().toArray();
    console.log(`📦 Collections to migrate: ${collections.map(c => c.name).join(', ')}`);

    for (const { name: collectionName } of collections) {
      console.log(`➡️ Processing "${collectionName}"...`);
      const sourceCollection = sourceDB.collection(collectionName);
      const targetCollection = targetDB.collection(collectionName);

      const docs = await sourceCollection.find({}).toArray();
      console.log(`   🔍 Found ${docs.length} documents in "${collectionName}"`);

      if (docs.length > 0) {
        const insertResult = await targetCollection.insertMany(docs);
        console.log(`   ✅ Inserted ${insertResult.insertedCount} into "${collectionName}"`);
      } else {
        console.log(`   ⚠️ No documents found in "${collectionName}", skipping`);
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrateData();
