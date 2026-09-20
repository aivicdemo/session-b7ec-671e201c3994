import { saveTeam, getFacilityById, getWorkerById } from '../../src/logic/data-persistence';
import { SaveTeamInput, GetWorkerByIdOutput, GetFacilityByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-546: チーム情報の拠点参照完全性エラー検証', () => {
  let mockGetFacilityById: jest.SpyInstance;
  let mockGetWorkerById: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFacilityById = jest.spyOn(require('../../src/logic/data-persistence'), 'getFacilityById');
    mockGetWorkerById = jest.spyOn(require('../../src/logic/data-persistence'), 'getWorkerById');
  });

  afterEach(() => {
    mockGetFacilityById.mockRestore();
    mockGetWorkerById.mockRestore();
  });

  test('指定された拠点IDが存在しないとき、InvalidFacilityIdError が発生する', async () => {
    // 準備: 入力値を準備する
    const input: SaveTeamInput = {
      teamId: null,
      teamName: '新規チームA',
      facilityId: 'FACILITY-999',
      teamLeaderId: 'LEADER-001',
      teamDescription: null,
      operatingStatus: '稼働中',
      capacity: 10,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    // 準備: getFacilityById がスタブ処理として拠点が存在しない状態を返す
    mockGetFacilityById.mockResolvedValueOnce(null);

    // 準備: getWorkerById がスタブ処理としてチームリーダーを返す
    const mockWorker: GetWorkerByIdOutput = {
      workerId: 'LEADER-001',
      workerName: 'リーダー太郎',
      facilityId: 'FACILITY-001',
      teamId: 'TEAM-001',
      jobType: 'チームリーダー',
      operatingStatus: '稼働中',
      hourlyRate: undefined,
      maxWorkingHours: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN-001',
      updatedBy: null,
    };
    mockGetWorkerById.mockResolvedValueOnce(mockWorker);

    // 実行: saveTeam 処理に準備した入力値を渡して実行する
    let thrownError: Error | null = null;
    try {
      await saveTeam(input);
      fail('InvalidFacilityIdError が発生するはずです');
    } catch (error: any) {
      thrownError = error;
    }

    // 検証: InvalidFacilityIdError エラーが発生することを確認
    expect(thrownError).not.toBeNull();
    expect(thrownError?.constructor?.name).toBe('InvalidFacilityIdError');

    // 検証: エラー文言は『指定された拠点が見つかりません。』であることを確認
    expect(thrownError?.message).toBe('指定された拠点が見つかりません。');

    // 検証: SaveTeamOutput は返されていないことを確認
    expect(thrownError).toBeDefined();

    // 検証: getFacilityById が facilityId='FACILITY-999' で呼び出されたことを確認
    expect(mockGetFacilityById).toHaveBeenCalledWith({ facilityId: 'FACILITY-999' });
  });
});