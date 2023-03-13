"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodburi = "mongodb://127.0.0.1:27017/"; // This is the default URI for MongoDB
class DatabaseClient {
    constructor(client) {
        this.client = client;
        this.db = this.client.db("hatirlatsana");
        this.client = client;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client.connect();
                console.log("[MongoDB] Connected to MongoDB");
            }
            catch (error) {
                console.log("[Error] Error connecting to MongoDB : " + error);
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.close();
                console.log("[MongoDB] Disconnected from MongoDB");
            }
            catch (error) {
                console.log("[Error] Error disconnecting from MongoDB : " + error);
            }
        });
    }
    connectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connect();
        });
    }
    disconnectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.disconnect();
        });
    }
    insertOne(collection, document, errorcallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.client.db("hatirlatsana");
            db.collection(collection).createIndex({ email: 1 }, { unique: true });
            db.collection(collection)
                .insertOne(document)
                .catch((err) => {
                errorcallback(err);
            });
        });
    }
    insertMany(collection, documents) {
        const db = this.client.db("hatirlatsana");
        db.collection(collection).insertMany(documents);
    }
    find(collection, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.client.db("hatirlatsana");
            return yield db.collection(collection).find(query).toArray();
        });
    }
}
exports.default = DatabaseClient;
