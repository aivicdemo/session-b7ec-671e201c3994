import { deleteDataByConditionAndType } from '../../src/logic/data-persistence';
import { jest } from '@jest/globals';

// 権限チェック関数をモック化するため、src/logic/data-persistence モジュール内の
// 内部関数の動作を制御する。実装の deleteDataByConditionAndType は直接呼び出す。
jest.mock('../../src/logic/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

import * as authorization from '../../src/logic/authorization';

describe('SCEN-1142: 削除権限なしの場合 AuthorizationError が発生', () => {
  let mockAuthorizeOperation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthorizeOperation = authorization.authorizeOperation as jest.Mock;
  });

  it('削除を実行するユーザーが削除対象データ型に対する削除権限を持たない場合、AuthorizationErrorが発生する', async () => {
    const userWithoutDeletePermission = 'user-without-delete-permission';
    const dataType = 'facility';
    const filterCondition = { id: 'FAC-001' };

    // authorizeOperation スタブを、指定されたユーザーIDと削除対象データ型「facility」の組み合わせに対して AuthorizationError を発生させるように設定する
    const authError = new Error('このユーザーは指定されたデータ型の削除権限を持っていません。');
    authError.name = 'AuthorizationError';
    
    mockAuthorizeOperation.mockImplementation((userId: string, dataTypeToCheck: string, _action?: string) => {
      if (userId === userWithoutDeletePermission && dataTypeToCheck === dataType) {
        throw authError;
      }
    });

    // deleteDataByConditionAndType を呼び出し、以下の入力を与える：dataType=\"facility\"、filterCondition={\"id\": \"FAC-001\"}、deletedBy=\"user-without-delete-permission\"
    let thrownError: Error | undefined;
    let result: unknown;
    
    try {
      result = await deleteDataByConditionAndType({
        dataType,
        filterCondition,
        deletedBy: userWithoutDeletePermission,
      });
    } catch (error) {
      thrownError = error as Error;
    }

    // 発生したエラーを検証する：AuthorizationError が発生し、エラーメッセージが「このユーザーは指定されたデータ型の削除権限を持っていません。」であること
    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('AuthorizationError');
    expect(thrownError?.message).toBe(
      'このユーザーは指定されたデータ型の削除権限を持っていません。'
    );
    
    // DeleteDataByConditionAndTypeOutput は返されない
    expect(result).toBeUndefined();
    
    // authorizeOperation が指定されたユーザーIDとデータ型で呼び出されたことを検証
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      userWithoutDeletePermission,
      dataType,
      expect.any(String)
    );
  });
});