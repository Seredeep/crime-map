declare module 'mongodb' {
  export class ObjectId {
    constructor(id?: string | number | ObjectId);
    toString(): string;
    toHexString(): string;
    equals(other: ObjectId): boolean;
    static isValid(id: string): boolean;
    static createFromHexString(hexString: string): ObjectId;
    static createFromTime(time: number): ObjectId;
  }

  export interface MongoClient {
    connect(): Promise<void>;
    close(): Promise<void>;
    db(name?: string): Db;
  }

  export interface Db {
    collection(name: string): Collection;
  }

  export interface Collection {
    find(query?: any): Cursor;
    findOne(query?: any): Promise<any>;
    insertOne(doc: any): Promise<any>;
    insertMany(docs: any[]): Promise<any>;
    updateOne(filter: any, update: any): Promise<any>;
    updateMany(filter: any, update: any): Promise<any>;
    deleteOne(filter: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
  }

  export interface Cursor {
    toArray(): Promise<any[]>;
    sort(sort: any): Cursor;
    limit(limit: number): Cursor;
    skip(skip: number): Cursor;
  }

  export function MongoClient(uri: string): MongoClient;
}
