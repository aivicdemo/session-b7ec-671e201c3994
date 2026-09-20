import { saveDepartment } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-616: saveDepartment - operation output matches input', () => {
  let authorizeUserActionStub: jest.SpyInstance;
  let validateInputDataStub: jest.SpyInstance;
  let findDepartmentByIdStub: jest.SpyInstance;
  let findUserByIdStub: jest.SpyInstance;

  beforeEach(() => {
    authorizeUserActionStub = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
    validateInputDataStub = jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(true);
    findDepartmentByIdStub = jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockResolvedValue({
      found: true,
      departmentId: 'dept-parent',
      departmentName: 'Parent Department',
      departmentCode: 'PARENT-001',
      description: null,
      parentDepartmentId: null,
      responsibleUserId: 'user-100',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findUserByIdStub = jest.spyOn(persistenceLayer, 'findUserById' as any).mockResolvedValue({
      found: true,
      userId: 'user-100',
      userName: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'admin',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('New Department Creation', () => {
    it('should save new department with operation=create and return success=true', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      const result = await saveDepartment(input);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.departmentId).toBeDefined();
      expect(typeof result.departmentId).toBe('string');
      expect(result.savedAt).toBeInstanceOf(Date);
      expect(result.message).toBeUndefined();
      expect(authorizeUserActionStub).toHaveBeenCalled();
      expect(validateInputDataStub).toHaveBeenCalled();
    });

    it('should verify authorizeUserAction is called for new department', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      await saveDepartment(input);

      expect(authorizeUserActionStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-01',
        }),
        expect.any(String)
      );
    });

    it('should verify validateInputData is called for new department', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      await saveDepartment(input);

      expect(validateInputDataStub).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should verify findUserById is called for responsibleUserId and createdBy', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      await saveDepartment(input);

      expect(findUserByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-100',
        })
      );
      expect(findUserByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-01',
        })
      );
    });

    it('should verify parentDepartmentId lookup when specified', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: 'dept-parent',
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      await saveDepartment(input);

      expect(findDepartmentByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: 'dept-parent',
        })
      );
    });
  });

  describe('Existing Department Update', () => {
    it('should save updated department with operation=update and return success=true', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      findUserByIdStub.mockResolvedValueOnce({
        found: true,
        userId: 'user-101',
        userName: 'testuser2',
        email: 'test2@example.com',
        fullName: 'Test User 2',
        role: 'admin',
        status: 'active',
      });

      findUserByIdStub.mockResolvedValueOnce({
        found: true,
        userId: 'admin-02',
        userName: 'admin2',
        email: 'admin2@example.com',
        fullName: 'Admin User 2',
        role: 'admin',
        status: 'active',
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      const result = await saveDepartment(input);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('update');
      expect(result.departmentId).toBe('dept-123');
      expect(result.savedAt).toBeInstanceOf(Date);
      expect(result.message).toBeUndefined();
    });

    it('should verify departmentId remains unchanged during update', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      const result = await saveDepartment(input);

      expect(result.departmentId).toEqual(input.departmentId);
    });

    it('should verify authorizeUserAction is called for update operation', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      await saveDepartment(input);

      expect(authorizeUserActionStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-02',
        }),
        expect.any(String)
      );
    });

    it('should verify findDepartmentById is called to validate existing department', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      await saveDepartment(input);

      expect(findDepartmentByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: 'dept-123',
        })
      );
    });

    it('should verify findUserById is called for responsibleUserId and updatedBy during update', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      await saveDepartment(input);

      expect(findUserByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-101',
        })
      );
      expect(findUserByIdStub).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-02',
        })
      );
    });
  });

  describe('Operation output verification', () => {
    it('should confirm operation output equals create input', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      const result = await saveDepartment(input);

      expect(result.operation).toStrictEqual(input.operation);
    });

    it('should confirm operation output equals update input', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      const result = await saveDepartment(input);

      expect(result.operation).toStrictEqual(input.operation);
    });
  });

  describe('Timestamp validation', () => {
    it('should return savedAt as UTC timestamp for create operation', async () => {
      const beforeCall = new Date();
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      const result = await saveDepartment(input);
      const afterCall = new Date();

      expect(result.savedAt).toBeInstanceOf(Date);
      expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should return savedAt as UTC timestamp for update operation', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const beforeCall = new Date();
      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      const result = await saveDepartment(input);
      const afterCall = new Date();

      expect(result.savedAt).toBeInstanceOf(Date);
      expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('Message field validation', () => {
    it('should return undefined message for successful create operation', async () => {
      const input = {
        departmentId: 'uuid-generated-new',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: undefined,
        requestingUserId: 'admin-01',
        operation: 'create' as const,
      };

      const result = await saveDepartment(input);

      expect(result.message).toBeUndefined();
    });

    it('should return undefined message for successful update operation', async () => {
      findDepartmentByIdStub.mockResolvedValueOnce({
        found: true,
        departmentId: 'dept-123',
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'user-100',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const input = {
        departmentId: 'dept-123',
        departmentName: '営業部（更新）',
        departmentCode: 'SALES-001',
        description: undefined,
        parentDepartmentId: null,
        responsibleUserId: 'user-101',
        status: 'active' as const,
        createdBy: 'admin-01',
        updatedBy: 'admin-02',
        requestingUserId: 'admin-02',
        operation: 'update' as const,
      };

      const result = await saveDepartment(input);

      expect(result.message).toBeUndefined();
    });
  });
});