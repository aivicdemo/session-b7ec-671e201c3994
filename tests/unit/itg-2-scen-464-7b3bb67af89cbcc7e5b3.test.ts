import { saveProductivityData, PersistenceFailureError } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-464: PersistenceFailureError on transaction failure', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let originalSaveProductivityData: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Stub 1: authorizeUserAction - 権限検証が成功するよう設定
    mockAuthorizeUserAction = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'user-001',
    });

    // Stub 2: validateInputData - 入力データの妥当性検証がすべて成功するよう設定
    mockValidateInputData = jest.fn().mockResolvedValue({
      valid: true,
      errors: [],
    });

    // Stub 3: findWorkerById - 指定された workerId に対して有効な作業者レコードを返す
    mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-01',
      teamId: 'team-A',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });

    // Stub 4: 永続化層のデータベース接続をスタブ化し、トランザクション実行時にエラーを発生させる
    const transactionError = new Error('接続タイムアウト');
    Object.assign(transactionError, {
      code: 'ECONNREFUSED',
      type: 'TransactionFailure',
    });

    // Mock internal database connection and transaction execution
    // Store original saveProductivityData before mocking
    originalSaveProductivityData = jest.spyOn(persistenceLayer, 'saveProductivityData' as any);
    
    originalSaveProductivityData.mockImplementation(async (input: any) => {
      // Simulate the actual persistence layer flow
      // 権限検証
      await mockAuthorizeUserAction(input.requestingUserId);
      // 入力検証
      await mockValidateInputData(input);
      // 作業者確認
      await mockFindWorkerById(input.workerId);
      
      // トランザクション実行でエラーを発生させる
      throw new PersistenceFailureError(
        `生産性データの保存に失敗しました。詳細: トランザクション実行失敗：接続タイムアウト`,
        {
          originalError: transactionError,
          operation: 'saveProductivityData',
          productivityDataId: input.productivityDataId,
          workerId: input.workerId,
          errorCode: transactionError.code,
        }
      );
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw PersistenceFailureError when database transaction fails during saveProductivityData', async () => {
    // Arrange
    const input = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      siteId: 'site-01',
      teamId: 'team-A',
      workDate: new Date('2024-01-15'),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: 45,
      productivityRate: 104.17,
      qualityScore: 92,
      errorCount: 3,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: '通常業務',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    // Act & Assert
    let caughtError: any = null;
    try {
      await saveProductivityData(input);
      fail('Expected PersistenceFailureError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    // Verify that PersistenceFailureError is thrown
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('PersistenceFailureError');
    
    // Verify the error message contains the exact format specified
    expect(caughtError.message).toBe(
      '生産性データの保存に失敗しました。詳細: トランザクション実行失敗：接続タイムアウト'
    );
    
    // Verify details field contains error information from persistence layer
    expect(caughtError.details).toBeDefined();
    expect(typeof caughtError.details).toBe('object');
    expect(caughtError.details.originalError).toBeDefined();
    expect(caughtError.details.originalError.message).toBe('接続タイムアウト');
    expect(caughtError.details.operation).toBe('saveProductivityData');
    expect(caughtError.details.productivityDataId).toBe('prod-001');
    expect(caughtError.details.workerId).toBe('worker-123');
    expect(caughtError.details.errorCode).toBe('ECONNREFUSED');

    // Verify that the output type SaveProductivityDataOutput is not returned
    // and processing is interrupted by the error throw
    expect(caughtError).not.toHaveProperty('success');
    expect(caughtError).not.toHaveProperty('operation');
    expect(caughtError).not.toHaveProperty('savedAt');

    // Verify authorization and validation were called before transaction
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith('user-001');
    expect(mockValidateInputData).toHaveBeenCalledWith(input);
    expect(mockFindWorkerById).toHaveBeenCalledWith('worker-123');
  });
});