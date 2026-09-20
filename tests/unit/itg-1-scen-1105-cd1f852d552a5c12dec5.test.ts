import { saveWmsSyncLog, type SaveWmsSyncLogInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1105: WMS連携ログの参照整合性検証', () => {
  let validateReferentialIntegritySpy: jest.SpyInstance;

  beforeEach(() => {
    validateReferentialIntegritySpy = jest.spyOn(dataPersistence, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('拠点IDが存在する場合、saveWmsSyncLog は参照整合性検証に成功してWMS連携ログを永続化する', async () => {
    validateReferentialIntegritySpy.mockResolvedValueOnce(undefined);

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-12345',
      createdBy: 'user001',
      updatedBy: undefined
    };

    const result = await saveWmsSyncLog(input);

    expect(result).toBeDefined();
    expect(result.wmsSyncLogId).toBeDefined();
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(100);
    expect(result.failureItemCount).toBe(0);
    expect(result.isNewRecord).toBe(true);
  });

  test('拠点IDが実在する拠点として妥当でない場合、validateReferentialIntegrity が呼び出される', async () => {
    validateReferentialIntegritySpy.mockRejectedValueOnce(
      new Error('拠点マスタに存在しない拠点ID: FAC-INVALID-9999')
    );

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-INVALID-9999',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-12345',
      createdBy: 'user001',
      updatedBy: undefined
    };

    await expect(saveWmsSyncLog(input)).rejects.toThrow();
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
  });

  test('validateReferentialIntegrity が facilityId パラメータとして \\'FAC-INVALID-9999\\' が正確に渡されたことが確認される', async () => {
    validateReferentialIntegritySpy.mockRejectedValueOnce(
      new Error('拠点マスタに存在しない拠点ID: FAC-INVALID-9999')
    );

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-INVALID-9999',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-12345',
      createdBy: 'user001',
      updatedBy: undefined
    };

    try {
      await saveWmsSyncLog(input);
    } catch (error) {
      // エラーが発生することを期待
    }

    expect(validateReferentialIntegritySpy).toHaveBeenCalledTimes(1);

    const callArgs = validateReferentialIntegritySpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs.length).toBeGreaterThan(0);

    const firstArg = callArgs[0];
    if (typeof firstArg === 'object' && firstArg !== null && 'facilityId' in firstArg) {
      expect((firstArg as any).facilityId).toStrictEqual('FAC-INVALID-9999');
    } else if (typeof firstArg === 'string') {
      expect(firstArg).toStrictEqual('FAC-INVALID-9999');
    } else {
      fail(`Expected facilityId parameter to be passed as 'FAC-INVALID-9999', but got: ${JSON.stringify(firstArg)}`);
    }
  });

  test('該当拠点が存在しないまたは無効な拠点として判定され、エラーが委譲される', async () => {
    const validationError = new Error('拠点が存在しないまたは無効な拠点です');
    validateReferentialIntegritySpy.mockRejectedValueOnce(validationError);

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-INVALID-9999',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-12345',
      createdBy: 'user001',
      updatedBy: undefined
    };

    await expect(saveWmsSyncLog(input)).rejects.toThrow(validationError);
  });

  test('参照整合性検証成功後、WMS連携ログが一元管理データとして永続化される', async () => {
    validateReferentialIntegritySpy.mockResolvedValueOnce(undefined);

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-12345',
      createdBy: 'user001',
      updatedBy: undefined
    };

    const result = await saveWmsSyncLog(input);

    expect(result).toBeDefined();
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(100);
    expect(result.failureItemCount).toBe(0);
  });

  test('既存WMS連携ログの更新時、参照整合性検証が実行される', async () => {
    validateReferentialIntegritySpy.mockResolvedValueOnce(undefined);

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: 'log-001',
      syncType: '作業実績送信',
      syncDirection: 'OUTBOUND',
      facilityId: 'FAC-002',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T11:00:00Z',
      syncCompletedDateTime: '2024-01-15T11:05:00Z',
      processedItemCount: 50,
      successItemCount: 50,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-54321',
      createdBy: 'user001',
      updatedBy: 'user002'
    };

    const result = await saveWmsSyncLog(input);

    expect(result.isNewRecord).toBe(false);
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
  });

  test('参照整合性検証失敗時、エラー処理が適切に委譲される', async () => {
    const referentialError = new Error('参照整合性チェック失敗');
    validateReferentialIntegritySpy.mockRejectedValueOnce(referentialError);

    const input: SaveWmsSyncLogInput = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-INVALID-XXXX',
      syncStatus: 'FAILURE',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:05:00Z',
      processedItemCount: 100,
      successItemCount: 50,
      failureItemCount: 50,
      errorMessage: 'Connection timeout',
      retryCount: 3,
      wmsRequestId: 'req-99999',
      createdBy: 'user001',
      updatedBy: undefined
    };

    await expect(saveWmsSyncLog(input)).rejects.toThrow(referentialError);
  });
});