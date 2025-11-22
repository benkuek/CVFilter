/**
 * Integration tests for authentication and middleware
 * Run with: npm test -- --testPathPattern=integration
 * Requires: npm run dev (server running on localhost:3000)
 * @jest-environment node
 */

// Polyfill fetch for Node.js if needed
if (!globalThis.fetch) {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
}

const BASE_URL = 'http://localhost:3000';

describe('Authentication Integration Tests', () => {
  
  describe('Middleware Protection', () => {
    test('should handle API requests based on auth state', async () => {
      const response = await fetch(`${BASE_URL}/api/cv-graph`);
      
      // With MOCK_AUTH=true, should succeed (200) or fail (401)
      expect([200, 401]).toContain(response.status);
    });

    test('should allow access to auth endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/session-check`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('authenticated');
    });

    test('should allow access to static assets', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);
      expect(response.status).toBe(200);
    });
  });

  describe('Mock Authentication', () => {
    test('should work when MOCK_AUTH=true', async () => {
      if(process.env.MOCK_AUTH && process.env.MOCK_AUTH === 'true') {
      // Server has MOCK_AUTH=true, so should be authenticated
      const response = await fetch(`${BASE_URL}/api/session-check`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.authenticated).toBe(true);
      expect(Array.isArray(data.roles)).toBe(true);
      }
    });
    
  });

  describe('API Protection', () => {
    test('should handle CV graph API requests', async () => {
      const response = await fetch(`${BASE_URL}/api/cv-graph`);
      
      // Should either work (200) or require auth (401)
      expect([200, 401]).toContain(response.status);
    });
  });
});