import { saveWmsSyncLog } from '../../src/logic/data-persistence';
import { SaveWmsSyncLogInput, SaveWmsSyncLogOutput } from '../../src/logic/data-persistence';

describe('SCEN-1100: WMS連携ログ保存時のデータベース接続失敗', () => {
  let mockDbConnection: any;
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDbConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    mockValidateDateTimeRange = jest.fn().mockResolvedValue(true);
    mockValidateNumericQuantity = jest.fn().mockResolvedValue(true);
    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue(true);

    (global as any).__dbConnection = mockDbConnection;
    (global as any).__validateDateTimeRange = mockValidateDateTimeRange;
    (global as any).__validateNumericQuantity = mockValidateNumericQuantity;
    (global as any).__validateReferentialIntegrity =
      mockValidateReferentialIntegrity;
  });

  afterEach(() => {
    delete (global as any).__dbConnection;
    delete (global as any).__validateDateTimeRange;
    delete (global as any).__validateNumericQuantity;
    delete (global as any).__validateReferentialIntegrity;
  });

  it('データベース接続がタイムアウトした場合、WmsSyncLogPersistenceFailure エラーが発生し、戻り値は undefined である', async () => {
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'FAILURE',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: null,
      processedItemCount: 100,
      successItemCount: 50,
      failureItemCount: 50,
      errorMessage: 'DB接続タイムアウト',
      retryCount: 0,
      wmsRequestId: 'WMS-REQ-12345',
      createdBy: 'user-001',
      updatedBy: null,
    };

    const timeoutError = new Error('接続喪失：接続がタイムアウトしました');
    mockDbConnection.execute.mockRejectedValue(timeoutError);

    let thrownError: any;
    let result: any;

    try {
      result = await saveWmsSyncLog(input);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('WmsSyncLogPersistenceFailure');
    expect(thrownError.message).toBe(
      'WMS連携ログの保存に失敗しました。システム管理者に報告してください。'
    );
    expect(result).toBeUndefined();
    expect(result).not.toBeInstanceOf(Object as any);

    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockValidateDateTimeRange).toHaveReturned();
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
    expect(mockValidateNumericQuantity).toHaveReturned();
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
    expect(mockValidateReferentialIntegrity).toHaveReturned();
    expect(mockDbConnection.execute).toHaveBeenCalled();
  });
});