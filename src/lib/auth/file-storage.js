import fs from 'fs/promises';
import path from 'path';
import logger from '../logger';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');


// JSON file storage
export class FileStorage {
  async _ensureFile() {
   
    try {
      await fs.access(USERS_FILE);
    } catch {
      try {
        await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
        await fs.writeFile(USERS_FILE, JSON.stringify({}));
      } catch (error) {
        logger.warn('Cannot write to filesystem (likely serverless environment)', { error: error.message });
      }
    }
  }

  async _readUsers() {
    const fs = getFs();
    if (!fs) return {};
    
    try {
      await this._ensureFile();
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn('Cannot read users file, returning empty data', { error: error.message });
      return {};
    }
  }

  async _writeUsers(users) {
    const fs = getFs();
    if (!fs) return;
    
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
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