import logger from '../logger';

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
    try {
      const result = await dynamodb.send(new this.GetCommand({
        TableName: this.tableName,
        Key: { email }
      }));
      return result.Item || { email, roles: [], _isNew: true };
    } catch (error) {
      // User doesn't exist, return default
      logger.info('User not found in DynamoDB, returning default', { email });
      return { email, roles: [], _isNew: true };
    }
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
export async function createStorage() {
  const storageType = process.env.STORAGE_TYPE || 'file';
  
  switch (storageType) {
    case 'dynamodb':
      return new DynamoStorage(process.env.DYNAMODB_TABLE);
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
      // const { FileStorage } = await import('./file-storage.js');
      // return new FileStorage();
  }
}