import { saveTeam } from '../../src/logic/data-persistence';

describe('SCEN-550: チーム情報管理 - チーム名重複エラー', () => {
  it('同一拠点内に同じチーム名が既に存在するとき、チーム名重複エラーが発生する', async () => {
    // テスト前提条件：拠点F001とそこに所属する作業者W001が存在することを確認
    // スタブ：getFacilityById('F001')がfacility情報を返す
    // スタブ：getWorkerById('W001')がworker情報を返す

    // テストデータセットアップ：同じfacilityId='F001'内に、teamName='チームA'のチームが既に存在する状態
    // 既存チーム：{ teamId: 'T001', teamName: 'チームA', facilityId: 'F001', ... }

    // saveTeam呼び出し：重複するチーム名で新規作成を試行
    const input = {
      teamId: null,
      teamName: 'チームA',
      facilityId: 'F001',
      teamLeaderId: 'W001',
      teamDescription: null,
      operatingStatus: '稼働中',
      capacity: 5,
      createdBy: 'U001',
      updatedBy: undefined,
    };

    // 期待結果：DuplicateTeamNameErrorが発生
    await expect(saveTeam(input)).rejects.toMatchObject({
      name: 'DuplicateTeamNameError',
      message: 'この拠点内に同じ名前のチームが既に存在します。',
    });

    // 出力型SaveTeamOutputが返されないことを確認
    // チーム情報が新規保存されていないことを確認
  });
});