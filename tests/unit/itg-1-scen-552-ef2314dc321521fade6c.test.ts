import { saveTeam, getTeamById, getFacilityById, getWorkerById } from '../../src/logic/data-persistence';

describe('SCEN-552: saveTeam - 既存チームの更新', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な既存チームIDを指定して更新するとき、チームが更新されて更新フラグ付きで返される', async () => {
    // 前提条件：既存チーム情報をセットアップ
    const existingTeamId = 'TEAM-001';
    const facilityId = 'FAC-001';
    const originalTeamLeaderId = 'WORKER-001';
    const newTeamLeaderId = 'WORKER-002';

    // 前提条件：拠点ID「FAC-001」が存在する状態をセットアップ
    const facilityData = {
      facilityId: facilityId,
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001-CODE',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: '稼働中',
      responsiblePersonName: '拠点責任者',
      contactInfo: '09000000000',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
    };

    // 前提条件：作業者ID「WORKER-002」が拠点「FAC-001」に所属する状態をセットアップ
    const workerData = {
      workerId: newTeamLeaderId,
      workerName: '新リーダー',
      facilityId: facilityId,
      teamId: existingTeamId,
      jobType: 'リーダー',
      operatingStatus: '稼働中',
      hourlyRate: undefined,
      maxWorkingHours: undefined,
      createdAt: '2024-01-05T08:00:00.000Z',
      updatedAt: '2024-01-05T08:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
    };

    // 前提条件：既存チームID「TEAM-001」が存在する状態をセットアップ
    const existingTeamData = {
      teamId: existingTeamId,
      teamName: '既存チームA',
      facilityId: facilityId,
      teamLeaderId: originalTeamLeaderId,
      teamDescription: '',
      operatingStatus: '稼働中',
      capacity: 10,
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z',
      createdBy: 'USER-ORIGINAL',
      updatedBy: null,
    };

    // 更新後のチーム状態
    const updatedTeamData = {
      teamId: existingTeamId,
      teamName: '既存チームA更新版',
      facilityId: facilityId,
      teamLeaderId: newTeamLeaderId,
      teamDescription: 'チームの説明を更新',
      operatingStatus: '稼働中',
      capacity: 15,
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-15T10:30:45.123Z',
      createdBy: 'USER-ORIGINAL',
      updatedBy: 'USER-UPDATE',
    };

    // モック：拠点と作業者の存在確認用スタブを構成
    jest.spyOn(require('../../src/logic/data-persistence'), 'getFacilityById').mockResolvedValue(facilityData);
    jest.spyOn(require('../../src/logic/data-persistence'), 'getWorkerById').mockResolvedValue(workerData);
    jest.spyOn(require('../../src/logic/data-persistence'), 'getTeamById').mockResolvedValue(updatedTeamData);

    // saveTeam を呼び出し：既存チームを更新
    const result = await saveTeam({
      teamId: existingTeamId,
      teamName: '既存チームA更新版',
      facilityId: facilityId,
      teamLeaderId: newTeamLeaderId,
      teamDescription: 'チームの説明を更新',
      operatingStatus: '稼働中',
      capacity: 15,
      createdBy: 'USER-ORIGINAL',
      updatedBy: 'USER-UPDATE',
    });

    // 期待結果の検証：返された SaveTeamOutput のフィールド値
    expect(result).toBeDefined();
    expect(result.teamId).toBe(existingTeamId);
    expect(result.teamName).toBe('既存チームA更新版');
    expect(result.facilityId).toBe(facilityId);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.isNewRecord).toBe(false);

    // 期待結果の検証：永続化後のデータをgetTeamByIdで確認
    const persistedTeam = await getTeamById({ teamId: existingTeamId });
    expect(persistedTeam).toBeDefined();
    expect(persistedTeam.teamId).toBe(existingTeamId);
    expect(persistedTeam.teamName).toBe('既存チームA更新版');
    expect(persistedTeam.facilityId).toBe(facilityId);
    expect(persistedTeam.teamLeaderId).toBe(newTeamLeaderId);
    expect(persistedTeam.capacity).toBe(15);
    expect(persistedTeam.teamDescription).toBe('チームの説明を更新');
    expect(persistedTeam.operatingStatus).toBe('稼働中');
    expect(persistedTeam.updatedBy).toBe('USER-UPDATE');
  });
});