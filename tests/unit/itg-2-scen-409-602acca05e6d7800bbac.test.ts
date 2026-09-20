import { saveUser } from '../../src/logic/persistence-layer';
import type { SaveUserInput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-409: SaveUser - InvalidSiteOrTeamError when site/team not found', () => {
  it('should throw InvalidSiteOrTeamError when invalid siteId is specified', async () => {
    // 2. validateInputDataスタブを設定し、入力データが有効と判定するよう返す
    const validateInputDataStub = jest.spyOn(persistenceLayer, 'validateInputData' as any)
      .mockResolvedValue(true);

    // 3. authorizeUserActionスタブを設定し、ユーザーが新規保存を実行する権限があると判定するよう返す
    const authorizeUserActionStub = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any)
      .mockResolvedValue(true);

    // 1. 存在しない拠点IDを指定したSaveUserInputを構成
    const input: SaveUserInput = {
      userId: 'USR001',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: 'Test User',
      role: '作業者',
      siteId: 'INVALID_SITE_001',
      teamId: null,
      status: '有効',
      createdBy: 'ADMIN001',
      updatedBy: undefined,
      requestingUserId: 'ADMIN001',
    };

    // 4. saveUserを上記InputでJestテストから呼び出す
    // 5. 戻り値のエラータイプを検証する
    try {
      await saveUser(input);
      fail('Expected InvalidSiteOrTeamError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidSiteOrTeamError');
      expect(error.message).toBe('指定された拠点またはチームが見つかりません。');
    }

    validateInputDataStub.mockRestore();
    authorizeUserActionStub.mockRestore();
  });
});