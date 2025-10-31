import path from 'path';
import logger from '../logger';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

// Dynamic fs loading for environments where it may not be available
let fs = null;
const getFs = () => {
  if (!fs) {
    try {
      // Use eval to prevent bundler from analyzing this require
      fs = eval('require')('fs/promises');
    } catch (error) {
      logger.warn('fs/promises not available in this environment: ' + error.message);
      return null;
    }
  }
  return fs;
};

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
    const fsModule = getFs();
    if (!fsModule) return;
    
    try {
      await fsModule.access(USERS_FILE);
    } catch {
      try {
        await fsModule.mkdir(path.dirname(USERS_FILE), { recursive: true });
        await fsModule.writeFile(USERS_FILE, JSON.stringify({}));
      } catch (error) {
        logger.warn('Cannot write to filesystem (likely serverless environment)', { error: error.message });
      }
    }
  }

  async _readUsers() {
    const fsModule = getFs();
    if (!fsModule) return {};
    
    try {
      await this._ensureFile();
      const data = await fsModule.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn('Cannot read users file, returning empty data', { error: error.message });
      return {};
    }
  }

  async _writeUsers(users) {
    const fsModule = getFs();
    if (!fsModule) return;
    
    try {
      await fsModule.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      logger.warn('Cannot write users file (likely serverless environment)', { error: error.message });
    }
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