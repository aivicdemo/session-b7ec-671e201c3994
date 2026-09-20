import {
  saveTeam,
  getFacilityById,
  getWorkerById,
} from '../../src/logic/data-persistence';

describe('SCEN-547: チームリーダー参照完全性エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたチームリーダーIDが存在しないか当該拠点に所属していないとき、InvalidTeamLeaderIdError が発生すること', async () => {
    // Arrange
    // モック設定: getFacilityById を呼び出して、存在する拠点ID「FAC-001」を持つ拠点情報を返す
    (getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001-CODE',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者名',
      contactInfo: 'contact@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-SYSTEM',
      updatedBy: null,
    });

    // モック設定: getWorkerById を呼び出して、存在しない作業者ID「WKR-INVALID」に対して null を返す
    (getWorkerById as jest.Mock).mockResolvedValue(null);

    // validateInputFormat をスタブ設定して、入力値が形式上有効であると仮定する
    // (※実装内でこの関数が呼び出される場合、そのモック設定が必要)

    // Act & Assert
    const teamInput = {
      teamId: null as string | null | undefined,
      teamName: 'テストチーム',
      facilityId: 'FAC-001',
      teamLeaderId: 'WKR-INVALID',
      teamDescription: null as string | null | undefined,
      operatingStatus: 'active',
      capacity: 10,
      createdBy: 'USR-ADMIN',
      updatedBy: undefined as string | undefined,
    };

    // InvalidTeamLeaderIdError が発生することを確認
    await expect(saveTeam(teamInput)).rejects.toMatchObject({
      name: 'InvalidTeamLeaderIdError',
      message: '指定されたチームリーダーが見つかりません。',
    });

    // getFacilityById が実装内で呼び出されたことを確認
    expect(getFacilityById).toHaveBeenCalledWith({
      facilityId: 'FAC-001',
    });

    // getWorkerById が実装内で呼び出されたことを確認
    expect(getWorkerById).toHaveBeenCalledWith({
      workerId: 'WKR-INVALID',
    });

    // チーム情報は保存されず、SaveTeamOutput は返却されないことを確認
    // (※エラー発生時、データベース操作が実行されていないことを確認するため、
    //   実装が任意のデータベース保存メソッドを呼び出していないことを検証することが理想的)
  });
});