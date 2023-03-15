import { MongoClient } from "mongodb";

export default class DatabaseClient {
  constructor(private client: MongoClient) {
    this.client = client;
  }

  private async connectDB() {
    try {
      this.client.connect();
      console.log("[MongoDB] Connected to MongoDB");
    } catch (error) {
      console.log("[Error] Error connecting to MongoDB : " + error);
    }
  }
  private database = this.client.db("hatirlatsana");

  private async disconnectDB() {
    try {
      await this.client.close();
      console.log("[MongoDB] Disconnected from MongoDB");
    } catch (error) {
      console.log("[Error] Error disconnecting from MongoDB : " + error);
    }
  }

  /*
   *GETTERS
   */

  public async connect(): Promise<void> {
    await this.connectDB();
  }

  public async disconnect() {
    await this.disconnectDB();
  }

  public db = this.database;
}
