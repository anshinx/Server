import { MongoClient } from "mongodb";

const mongodburi = "mongodb://127.0.0.1:27017/"; // This is the default URI for MongoDB

export default class DatabaseClient {
  constructor(private client: MongoClient) {
    this.client = client;
  }

  public async connect() {
    try {
      this.client.connect();
      console.log("[MongoDB] Connected to MongoDB");
    } catch (error) {
      console.log("[Error] Error connecting to MongoDB : " + error);
    }
  }

  public async disconnect() {
    try {
      await this.client.close();
      console.log("[MongoDB] Disconnected from MongoDB");
    } catch (error) {
      console.log("[Error] Error disconnecting from MongoDB : " + error);
    }
  }

  public async connectDB() {
    await this.connect();
  }

  public async disconnectDB() {
    await this.disconnect();
  }

  public db = this.client.db("hatirlatsana");

  public async insertOne(
    collection: string,
    document: {},
    errorcallback: Function
  ) {
    const db = this.client.db("hatirlatsana");
    db.collection(collection).createIndex({ email: 1 }, { unique: true });
    db.collection(collection)
      .insertOne(document)
      .catch((err) => {
        errorcallback(err);
      });
  }

  public insertMany(collection: string, documents: any[]) {
    const db = this.client.db("hatirlatsana");
    db.collection(collection).insertMany(documents);
  }

  public async find(collection: string, query: any) {
    const db = this.client.db("hatirlatsana");

    return await db.collection(collection).find(query).toArray();
  }
}
