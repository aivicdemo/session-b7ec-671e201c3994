import {
  saveWorker,
  SaveWorkerInput,
  SaveWorkerOutput,
  getFacilityById,
  getTeamById,
} from '../../src/logic/data-persistence';

describe('最大稼働時間が未指定でも保存が成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maxWorkingHoursがundefinedの場合、saveWorkerは正常に完了し、maxWorkingHoursがundefinedのまま永続化される', async () => {
    // 入力オブジェクトの構築
    const input: SaveWorkerInput = {
      workerId: null,
      workerName: '田中太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1200,
      maxWorkingHours: undefined,
      createdBy: 'USER001',
      updatedBy: null,
    };

    // 拠点マスタデータを前提として準備
    const facilityData = {
      facilityId: 'FAC001',
      facilityName: '東京拠点',
      facilityCode: 'TK001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '03-1234-5678',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'ADMIN001',
      updatedBy: null,
    };

    // チームマスタデータを前提として準備
    const teamData = {
      teamId: 'TEAM001',
      teamName: 'チームA',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: 'ピッキングチーム',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'ADMIN001',
      updatedBy: null,
    };

    // getFacilityById をスタブで設定
    const getFacilityByIdSpy = jest
      .spyOn(require('../../src/logic/data-persistence'), 'getFacilityById')
      .mockResolvedValue(facilityData);

    // getTeamById をスタブで設定
    const getTeamByIdSpy = jest
      .spyOn(require('../../src/logic/data-persistence'), 'getTeamById')
      .mockResolvedValue(teamData);

    // saveWorker を呼び出す
    const result: SaveWorkerOutput = await saveWorker(input);

    // 期待される結果の検証
    expect(result).toBeDefined();
    expect(result.workerName).toBe('田中太郎');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.isNewRecord).toBe(true);

    // workerId が新規生成されていることを確認
    expect(result.workerId).toBeDefined();
    expect(typeof result.workerId).toBe('string');
    expect(result.workerId.length).toBeGreaterThan(0);

    // savedAt が ISO 8601 形式であることを確認
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.savedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // 新規作成フラグが true であることを確認
    expect(result.isNewRecord).toBe(true);

    // エラーが発生していないことを確認
    expect(result).not.toBeNull();

    // getFacilityById が正しい引数で呼ばれたことを確認
    expect(getFacilityByIdSpy).toHaveBeenCalledWith('FAC001');
    expect(getFacilityByIdSpy).toHaveBeenCalledTimes(1);

    // getTeamById が正しい引数で呼ばれたことを確認
    expect(getTeamByIdSpy).toHaveBeenCalledWith('FAC001', 'TEAM001');
    expect(getTeamByIdSpy).toHaveBeenCalledTimes(1);

    // maxWorkingHoursがundefinedのまま保存されていることを確認
    // resultオブジェクトにmaxWorkingHoursフィールドが存在せず、またはundefinedであることを検証
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('workerName', '田中太郎');
    expect(result).toHaveProperty('facilityId', 'FAC001');
    expect(result).toHaveProperty('teamId', 'TEAM001');
    expect(result).toHaveProperty('isNewRecord', true);
    
    // maxWorkingHours が入力値のままundefinedであることを確認
    if ('maxWorkingHours' in result) {
      expect(result.maxWorkingHours).toBeUndefined();
    }
  });
});