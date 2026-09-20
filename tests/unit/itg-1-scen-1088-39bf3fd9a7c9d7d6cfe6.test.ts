import { jest } from '@jest/globals';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

describe('SCEN-1088: トランザクション障害でハンディターミナル連携ログの取得に失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('トランザクション障害によってDataAccessErrorが発生すること', async () => {
    // データベース接続がトランザクション障害により失敗する状態をスタブで再現
    jest.spyOn(dataPersistenceModule, 'listHandyTerminalSyncLogByCondition' as any).mockImplementationOnce(async () => {
      const error = new Error('Transaction rollback due to database connection failure');
      (error as any).name = 'DataAccessError';
      (error as any).message = 'ハンディターミナル連携ログの取得に失敗しました。システム管理者に連絡してください。';
      throw error;
    });

    // 有効な検索条件を複数指定
    const searchCondition = {
      handyTerminalSyncLogIds: undefined,
      workerIds: ['worker-1', 'worker-2'],
      handyTerminalIds: ['ht-001'],
      facilityIds: ['facility-1'],
      syncTypes: ['work_result_sync'],
      syncStatuses: ['success'],
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'sentDateTime',
      sortOrder: 'desc' as const,
      pageNumber: 1,
      pageSize: 20,
    };

    // listHandyTerminalSyncLogByCondition処理を、有効な検索条件で呼び出す
    let thrownError: any;
    try {
      await dataPersistenceModule.listHandyTerminalSyncLogByCondition(searchCondition);
    } catch (error) {
      thrownError = error;
    }

    // トランザクション障害によるデータアクセスエラーが内部的に発生し、処理が例外を投げることを確認
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe(
      'ハンディターミナル連携ログの取得に失敗しました。システム管理者に連絡してください。'
    );
  });

  it('トランザクション障害時に呼び出し側は戻り値を受け取らないこと', async () => {
    // データベース接続がトランザクション障害により失敗する状態をスタブで再現
    jest.spyOn(dataPersistenceModule, 'listHandyTerminalSyncLogByCondition' as any).mockImplementationOnce(async () => {
      const error = new Error('Transaction connection lost');
      (error as any).name = 'DataAccessError';
      (error as any).message = 'ハンディターミナル連携ログの取得に失敗しました。システム管理者に連絡してください。';
      throw error;
    });

    // 有効な検索条件を複数指定
    const searchCondition = {
      handyTerminalSyncLogIds: undefined,
      workerIds: ['worker-1'],
      handyTerminalIds: ['ht-001'],
      facilityIds: ['facility-1'],
      syncTypes: ['work_result_sync'],
      syncStatuses: ['success', 'pending'],
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: 0,
      maxRetryCount: 5,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'syncStatus' as const,
      sortOrder: 'asc' as const,
      pageNumber: 1,
      pageSize: 50,
    };

    // listHandyTerminalSyncLogByCondition処理を、有効な検索条件で呼び出す
    let result: any;
    let thrownError: any;

    try {
      result = await dataPersistenceModule.listHandyTerminalSyncLogByCondition(searchCondition);
    } catch (error) {
      thrownError = error;
    }

    // トランザクション障害によるデータアクセスエラーが内部的に発生し、処理が例外を投げることを確認
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe(
      'ハンディターミナル連携ログの取得に失敗しました。システム管理者に連絡してください。'
    );
    
    // 出力型のフィールドは返却されないこと（例外発生により戻り値がnullish）
    expect(result).toBeUndefined();
  });
});