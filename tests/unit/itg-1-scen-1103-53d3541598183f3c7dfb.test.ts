import { saveWmsSyncLog } from '../../src/logic/data-persistence';
import { SaveWmsSyncLogInput, SaveWmsSyncLogOutput } from '../../src/logic/data-persistence';

describe('SCEN-1103: WMS連携ログの新規作成 - 連携完了日時がnullの場合', () => {
  let validateDateTimeRangeMock: jest.Mock;
  let validateNumericQuantityMock: jest.Mock;
  let validateReferentialIntegrityMock: jest.Mock;
  let dbSaveMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    validateDateTimeRangeMock = jest.fn().mockResolvedValue({ valid: true });
    validateNumericQuantityMock = jest.fn().mockResolvedValue({ valid: true });
    validateReferentialIntegrityMock = jest.fn().mockResolvedValue({ valid: true });
    dbSaveMock = jest.fn();
  });

  it('連携完了日時がnullの場合、進行中のログとして保存される', async () => {
    // Arrange: 入力データを準備
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T09:00:00Z',
      syncCompletedDateTime: null,
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: 'REQ-12345',
      createdBy: 'USER-001',
      updatedBy: null,
    };

    const currentDateTime = new Date().toISOString();

    // スタブ化：検証処理と保存処理
    jest.spyOn(require('../../src/logic/data-persistence'), 'validateDateTimeRange').mockImplementation(validateDateTimeRangeMock);
    jest.spyOn(require('../../src/logic/data-persistence'), 'validateNumericQuantity').mockImplementation(validateNumericQuantityMock);
    jest.spyOn(require('../../src/logic/data-persistence'), 'validateReferentialIntegrity').mockImplementation(validateReferentialIntegrityMock);

    dbSaveMock.mockResolvedValue({
      wmsSyncLogId: 'LOG-NEW-001',
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'SUCCESS',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      savedAt: currentDateTime,
      isNewRecord: true,
    } as SaveWmsSyncLogOutput);

    // Act: saveWmsSyncLogを呼び出し
    const result = await saveWmsSyncLog(input);

    // Assert: 出力を検証
    expect(result).toBeDefined();
    expect(result.wmsSyncLogId).toBe('LOG-NEW-001');
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(100);
    expect(result.failureItemCount).toBe(0);
    expect(result.savedAt).toBeTruthy();
    expect(typeof result.savedAt).toBe('string');
    // ISO 8601形式の検証
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.isNewRecord).toBe(true);

    // 検証処理が呼び出されたことを確認
    expect(validateDateTimeRangeMock).toHaveBeenCalled();
    expect(validateNumericQuantityMock).toHaveBeenCalled();
    expect(validateReferentialIntegrityMock).toHaveBeenCalled();
  });
});