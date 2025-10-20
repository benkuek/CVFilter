import fs from 'fs/promises';
import path from 'path';
import logger from '../logger.ts';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

// Storage interface
class UserStorage {
  async getUser(email) {
    throw new Error('Not implemented');
  }

  async setUserRoles(email, roles) {
    throw new Error('Not implemented');
  }

  async getAllUsers() {
    throw new Error('Not implemented');
  }
}

// JSON file storage
class FileStorage extends UserStorage {
  async _ensureFile() {
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify({}));
    }
  }

  async _readUsers() {
    await this._ensureFile();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  }

  async _writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  async getUser(email) {
    const users = await this._readUsers();
    return users[email] || { email, roles: [] };
  }

  async setUserRoles(email, roles) {
    const users = await this._readUsers();
    users[email] = { email, roles };
    await this._writeUsers(users);
  }

  async getAllUsers() {
    const users = await this._readUsers();
    return Object.values(users);
  }
}

// DynamoDB storage
class DynamoStorage extends UserStorage {
  constructor(tableName = 'Users') {
    super();
    this.tableName = tableName;
    this.dynamodb = null;
  }

  async _getDynamoDB() {
    if (!this.dynamodb) {
      try {
        const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
        const client = new DynamoDBClient({});
        this.dynamodb = DynamoDBDocumentClient.from(client);
        this.GetCommand = GetCommand;
        this.PutCommand = PutCommand;
        this.ScanCommand = ScanCommand;
      } catch (error) {
        logger.error('AWS SDK not installed', { error: error.message });
        throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb');
      }
    }
    return this.dynamodb;
  }

  async getUser(email) {
    const dynamodb = await this._getDynamoDB();
    const result = await dynamodb.send(new this.GetCommand({
      TableName: this.tableName,
      Key: { email }
    }));
    return result.Item || { email, roles: [] };
  }

  async setUserRoles(email, roles) {
    const dynamodb = await this._getDynamoDB();
    await dynamodb.send(new this.PutCommand({
      TableName: this.tableName,
      Item: { email, roles }
    }));
  }

  async getAllUsers() {
    const dynamodb = await this._getDynamoDB();
    const result = await dynamodb.send(new this.ScanCommand({
      TableName: this.tableName
    }));
    return result.Items || [];
  }
}

// Factory
export function createStorage() {
  const storageType = process.env.STORAGE_TYPE || 'file';
  
  switch (storageType) {
    case 'dynamodb':
      return new DynamoStorage(process.env.DYNAMODB_TABLE);
    default:
      return new FileStorage();
  }
}