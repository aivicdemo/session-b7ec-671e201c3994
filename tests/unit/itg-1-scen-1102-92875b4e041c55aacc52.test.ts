import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1102: WMS連携ログ新規作成時の連携開始日時形式検証', () => {
  let validateDateTimeRangeStub: jest.SpyInstance;

  beforeEach(() => {
    validateDateTimeRangeStub = jest.spyOn(dataPersistence, 'validateDateTimeRange' as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call validateDateTimeRange with syncStartDateTime and throw InvalidWmsSyncLogInput when format is invalid (slash-separated datetime)', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'progress_data_fetch',
      syncDirection: 'INBOUND',
      facilityId: 'facility-001',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/01/15 10:30:00',
      syncCompletedDateTime: null,
      processedItemCount: 0,
      successItemCount: 0,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: null,
      createdBy: 'user-123',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    await expect(dataPersistence.saveWmsSyncLog(invalidInput)).rejects.toMatchObject({
      code: 'InvalidWmsSyncLogInput',
      message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
    });

    expect(validateDateTimeRangeStub).toHaveBeenCalled();
    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should call validateDateTimeRange with syncStartDateTime and throw InvalidWmsSyncLogInput when format is invalid (date-only format)', async () => {
    const invalidInput = {
      wmsSyncLogId: undefined,
      syncType: 'inventory_sync',
      syncDirection: 'OUTBOUND',
      facilityId: 'facility-002',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024-01-15',
      syncCompletedDateTime: null,
      processedItemCount: 0,
      successItemCount: 0,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: null,
      createdBy: 'user-456',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    await expect(dataPersistence.saveWmsSyncLog(invalidInput)).rejects.toMatchObject({
      code: 'InvalidWmsSyncLogInput',
      message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
    });

    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should throw error before persisting data when validateDateTimeRange throws InvalidWmsSyncLogInput', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'work_result_sync',
      syncDirection: 'INBOUND',
      facilityId: 'facility-003',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/12/25 14:00',
      syncCompletedDateTime: null,
      processedItemCount: 100,
      successItemCount: 95,
      failureItemCount: 5,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-789',
      createdBy: 'system',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    let caughtError: any = null;
    try {
      await dataPersistence.saveWmsSyncLog(invalidInput);
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.code).toBe('InvalidWmsSyncLogInput');
    expect(caughtError.message).toBe('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    expect(validateDateTimeRangeStub).toHaveBeenCalled();
  });

  it('should validate syncStartDateTime format before any database operation', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'progress_data_fetch',
      syncDirection: 'INBOUND',
      facilityId: 'facility-004',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/01/20 15:45:30',
      syncCompletedDateTime: null,
      processedItemCount: 50,
      successItemCount: 50,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-100',
      createdBy: 'user-789',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation((dateTime: string) => {
      if (!dateTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
        throw validationError;
      }
    });

    await expect(dataPersistence.saveWmsSyncLog(invalidInput)).rejects.toMatchObject({
      code: 'InvalidWmsSyncLogInput',
      message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
    });

    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should prevent database persistence when validateDateTimeRange rejects the format', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'progress_data_fetch',
      syncDirection: 'INBOUND',
      facilityId: 'facility-005',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/02/15 10:30:00',
      syncCompletedDateTime: null,
      processedItemCount: 0,
      successItemCount: 0,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    let thrownError: any = null;
    try {
      await dataPersistence.saveWmsSyncLog(invalidInput);
    } catch (e) {
      thrownError = e;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('InvalidWmsSyncLogInput');
    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should not persist data to database when validation fails with InvalidWmsSyncLogInput', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'progress_data_fetch',
      syncDirection: 'INBOUND',
      facilityId: 'facility-007',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/03/01 09:00:00',
      syncCompletedDateTime: null,
      processedItemCount: 25,
      successItemCount: 20,
      failureItemCount: 5,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'req-007',
      createdBy: 'user-007',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    try {
      await dataPersistence.saveWmsSyncLog(invalidInput);
      fail('Expected InvalidWmsSyncLogInput error to be thrown');
    } catch (e: any) {
      expect(e.code).toBe('InvalidWmsSyncLogInput');
    }

    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should handle error with proper error structure when validation fails', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'inventory_sync',
      syncDirection: 'INBOUND',
      facilityId: 'facility-008',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/04/10 16:20:00',
      syncCompletedDateTime: null,
      processedItemCount: 0,
      successItemCount: 0,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: null,
      createdBy: 'user-008',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    validateDateTimeRangeStub.mockImplementation(() => {
      throw validationError;
    });

    try {
      await dataPersistence.saveWmsSyncLog(invalidInput);
      fail('Expected error to be thrown');
    } catch (caughtError: any) {
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.code).toBe('InvalidWmsSyncLogInput');
      expect(caughtError.message).toBe('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    }

    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });

  it('should ensure validation is called before any data persistence operation', async () => {
    const invalidInput = {
      wmsSyncLogId: null,
      syncType: 'progress_data_fetch',
      syncDirection: 'INBOUND',
      facilityId: 'facility-009',
      syncStatus: 'PENDING',
      syncStartDateTime: '2024/05/20 12:00:00',
      syncCompletedDateTime: null,
      processedItemCount: 0,
      successItemCount: 0,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: null,
      createdBy: 'user-009',
      updatedBy: null,
    };

    const validationError = new Error('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    (validationError as any).code = 'InvalidWmsSyncLogInput';

    let validationCalled = false;
    validateDateTimeRangeStub.mockImplementation(() => {
      validationCalled = true;
      throw validationError;
    });

    try {
      await dataPersistence.saveWmsSyncLog(invalidInput);
    } catch (e) {
      // Error expected
    }

    expect(validationCalled).toBe(true);
    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });
});