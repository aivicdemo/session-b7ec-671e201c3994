import { authenticateUser } from '../../src/logic/authorization-and-validation';
import * as authModule from '../../src/logic/authorization-and-validation';

describe('SCEN-1024: authenticateUser', () => {
  it('should return authenticated user context with valid credentials', async () => {
    const validateRequiredFieldsStub = jest.fn().mockReturnValue({
      isValid: true,
      missingFields: []
    });

    const validateFieldFormatStub = jest.fn().mockReturnValue({
      isValid: true,
      fieldName: 'userId',
      violationType: null,
      expectedConstraint: null,
      actualValue: 'user001',
      message: null
    });

    jest.spyOn(authModule, 'validateRequiredFields').mockImplementation(validateRequiredFieldsStub);
    jest.spyOn(authModule, 'validateFieldFormat').mockImplementation(validateFieldFormatStub);

    try {
      const input = {
        userId: 'user001',
        password: 'password123'
      };

      const result = await authenticateUser(input);

      expect(result.success).toBe(true);
      expect(result.userContext).toBeDefined();
      expect(result.userContext).not.toBeNull();
      
      if (result.userContext) {
        expect(result.userContext.userId).toBeDefined();
        expect(typeof result.userContext.userId).toBe('string');
        expect(result.userContext.userId.length).toBeGreaterThan(0);

        expect(result.userContext.userName).toBeDefined();
        expect(typeof result.userContext.userName).toBe('string');
        expect(result.userContext.userName.length).toBeGreaterThan(0);

        expect(result.userContext.role).toBeDefined();
        expect(typeof result.userContext.role).toBe('string');
        expect(result.userContext.role.length).toBeGreaterThan(0);

        expect(result.userContext.siteId).toBeDefined();
        expect(result.userContext.siteId === null || typeof result.userContext.siteId === 'string').toBe(true);

        expect(result.userContext.teamId).toBeDefined();
        expect(result.userContext.teamId === null || typeof result.userContext.teamId === 'string').toBe(true);

        expect(result.userContext.permissions).toBeDefined();
        expect(Array.isArray(result.userContext.permissions)).toBe(true);
      }

      expect(result.authToken).toBeDefined();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken).not.toBeNull();
      expect(result.authToken.length).toBeGreaterThan(0);

      expect(result.expiresAt).toBeDefined();
      expect(typeof result.expiresAt).toBe('string');
      expect(result.expiresAt).not.toBeNull();
      
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(iso8601Regex.test(result.expiresAt)).toBe(true);
      
      const expiresDate = new Date(result.expiresAt);
      expect(expiresDate.toISOString()).toBe(result.expiresAt);
      expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
    } finally {
      jest.restoreAllMocks();
    }
  });
});