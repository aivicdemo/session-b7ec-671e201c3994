import { saveWmsSyncLog, SaveWmsSyncLogInput } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

describe('SCEN-1104: WMS連携ログ保存時の数値妥当性検証', () => {
  let validateNumericQuantityStub: jest.SpyInstance;

  beforeEach(() => {
    validateNumericQuantityStub = jest.spyOn(dataPersistenceModule, 'validateNumericQuantity' as any).mockImplementation((processed: number, success: number, failure: number) => {
      if (processed < 0 || success < 0 || failure < 0) {
        throw new Error('InvalidWmsSyncLogInput: Item counts must be non-negative');
      }
      if (success + failure > processed) {
        throw new Error('InvalidWmsSyncLogInput: Success and failure counts cannot exceed processed count');
      }
      return { valid: true };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('processedItemCount が負の数値の場合、validateNumericQuantity が呼び出され、数値妥当性検証が実行される', async () => {
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T10:00:00Z',
      syncCompletedDateTime: '2025-01-15T10:05:00Z',
      processedItemCount: -5,
      successItemCount: 3,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    let thrownError: Error | undefined;
    try {
      await saveWmsSyncLog(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(validateNumericQuantityStub).toHaveBeenCalled();
    expect(validateNumericQuantityStub).toHaveBeenCalledWith(-5, 3, 0);
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toContain('InvalidWmsSyncLogInput');
  });

  it('validateNumericQuantity の呼び出し引数に processedItemCount、successItemCount、failureItemCount が含まれることを確認', async () => {
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T10:00:00Z',
      syncCompletedDateTime: '2025-01-15T10:05:00Z',
      processedItemCount: -5,
      successItemCount: 3,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await saveWmsSyncLog(input);
    } catch (error) {
      // Expected error for negative processedItemCount
    }

    expect(validateNumericQuantityStub).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );

    const callArgs = validateNumericQuantityStub.mock.calls[0];
    expect(callArgs[0]).toBe(-5);
    expect(callArgs[1]).toBe(3);
    expect(callArgs[2]).toBe(0);
  });

  it('validateNumericQuantity の検証結果に基づいて InvalidWmsSyncLogInput エラーが発生すること', async () => {
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T10:00:00Z',
      syncCompletedDateTime: '2025-01-15T10:05:00Z',
      processedItemCount: -5,
      successItemCount: 3,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    await expect(saveWmsSyncLog(input)).rejects.toThrow('InvalidWmsSyncLogInput');
  });

  it('validateNumericQuantity が妥当でない状態（処理対象件数が負の数）を検出する', async () => {
    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T10:00:00Z',
      syncCompletedDateTime: '2025-01-15T10:05:00Z',
      processedItemCount: -5,
      successItemCount: 3,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await saveWmsSyncLog(input);
      fail('Expected InvalidWmsSyncLogInput error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Item counts must be non-negative');
    }

    expect(validateNumericQuantityStub).toHaveBeenCalledWith(-5, 3, 0);
  });
});