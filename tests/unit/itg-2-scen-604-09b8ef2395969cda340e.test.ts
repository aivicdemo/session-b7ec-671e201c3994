import { findAllActiveWorkTypes } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-604: findAllActiveWorkTypes - 権限チェック', () => {
  let authorizeUserActionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リクエストユーザーが無効または権限がない場合、アクセス拒否エラーが発生する', async () => {
    const UnauthorizedAccessError = class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedAccessError';
      }
    };

    authorizeUserActionSpy = jest.spyOn(persistenceLayer as any, 'authorizeUserAction' as any)
      .mockImplementation(() => {
        throw new UnauthorizedAccessError('作業タイプマスタへのアクセス権限がありません。');
      });

    const invalidRequestingUserId = '';

    try {
      await findAllActiveWorkTypes({
        requestingUserId: invalidRequestingUserId,
      });
      fail('エラーが発生しませんでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('UnauthorizedAccessError');
      if (error instanceof Error) {
        expect(error.message).toBe('作業タイプマスタへのアクセス権限がありません。');
      }
    }

    expect(authorizeUserActionSpy).toHaveBeenCalled();
  });

  it('nullをrequestingUserIdに指定した場合、UnauthorizedAccessErrorが発生する', async () => {
    const UnauthorizedAccessError = class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedAccessError';
      }
    };

    authorizeUserActionSpy = jest.spyOn(persistenceLayer as any, 'authorizeUserAction' as any)
      .mockImplementation(() => {
        throw new UnauthorizedAccessError('作業タイプマスタへのアクセス権限がありません。');
      });

    try {
      await findAllActiveWorkTypes({
        requestingUserId: null as any,
      });
      fail('エラーが発生しませんでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('UnauthorizedAccessError');
      if (error instanceof Error) {
        expect(error.message).toBe('作業タイプマスタへのアクセス権限がありません。');
      }
    }

    expect(authorizeUserActionSpy).toHaveBeenCalled();
  });

  afterEach(() => {
    authorizeUserActionSpy?.mockRestore();
  });
});