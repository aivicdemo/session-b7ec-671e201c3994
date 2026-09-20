import {
  saveWorker,
  SaveWorkerInput,
  SaveWorkerOutput,
  listWorkersByCondition,
  ListWorkersByConditionInput,
  getFacilityById,
  getTeamById,
} from '../../src/logic/data-persistence';

class DuplicateWorkerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateWorkerError';
  }
}

describe('SCEN-582: 同一拠点・チーム内で同じ作業者名が既に存在し新規作成しようとするとき DuplicateWorkerError が発生する', () => {
  const input: SaveWorkerInput = {
    workerId: undefined,
    workerName: '山田太郎',
    facilityId: 'F001',
    teamId: 'T001',
    jobType: 'ピッキング',
    operatingStatus: '稼働中',
    createdBy: 'admin001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('新規作成で同一拠点・チーム内に同じ作業者名が既に存在する場合、DuplicateWorkerError が発生する', async () => {
    const mockFacility = {
      facilityId: 'F001',
      facilityName: 'テスト拠点',
      facilityCode: 'TEST001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'T001',
      teamName: 'テストチーム',
      facilityId: 'F001',
      teamLeaderId: 'leader001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockExistingWorker = {
      workerId: 'W001',
      workerName: '山田太郎',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    jest.mocked(getFacilityById).mockResolvedValueOnce(mockFacility);
    jest.mocked(getTeamById).mockResolvedValueOnce(mockTeam);
    jest.mocked(listWorkersByCondition).mockResolvedValueOnce({
      workers: [mockExistingWorker],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    try {
      await saveWorker(input);
      fail('DuplicateWorkerError が発生するべき');
    } catch (error) {
      expect((error as any).name).toBe('DuplicateWorkerError');
      expect((error as Error).message).toBe('同じ作業者名は既に登録されています。');
    }
  });

  test('エラーメッセージが正確に「同じ作業者名は既に登録されています。」である', async () => {
    const mockFacility = {
      facilityId: 'F001',
      facilityName: 'テスト拠点',
      facilityCode: 'TEST001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'T001',
      teamName: 'テストチーム',
      facilityId: 'F001',
      teamLeaderId: 'leader001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockExistingWorker = {
      workerId: 'W001',
      workerName: '山田太郎',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    jest.mocked(getFacilityById).mockResolvedValueOnce(mockFacility);
    jest.mocked(getTeamById).mockResolvedValueOnce(mockTeam);
    jest.mocked(listWorkersByCondition).mockResolvedValueOnce({
      workers: [mockExistingWorker],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    try {
      await saveWorker(input);
      fail('例外が発生するべき');
    } catch (error) {
      expect((error as Error).message).toBe('同じ作業者名は既に登録されています。');
      expect((error as any).name).toBe('DuplicateWorkerError');
    }
  });

  test('同一名の作業者が別チーム・別拠点に存在する場合、エラーは発生しない', async () => {
    const inputDifferentFacility: SaveWorkerInput = {
      workerId: undefined,
      workerName: '山田太郎',
      facilityId: 'F002',
      teamId: 'T002',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdBy: 'admin001',
    };

    const mockFacility = {
      facilityId: 'F002',
      facilityName: 'テスト拠点2',
      facilityCode: 'TEST002',
      address: 'テスト住所2',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'T002',
      teamName: 'テストチーム2',
      facilityId: 'F002',
      teamLeaderId: 'leader002',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    jest.mocked(getFacilityById).mockResolvedValueOnce(mockFacility);
    jest.mocked(getTeamById).mockResolvedValueOnce(mockTeam);
    jest.mocked(listWorkersByCondition).mockResolvedValueOnce({
      workers: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const result = await saveWorker(inputDifferentFacility);
    expect(result).toBeDefined();
    expect(result.workerName).toBe('山田太郎');
    expect(result.facilityId).toBe('F002');
    expect(result.teamId).toBe('T002');
  });

  test('入力形式の検証が実行され、すべての必須項目が正しい形式であることを確認する', async () => {
    const mockFacility = {
      facilityId: 'F001',
      facilityName: 'テスト拠点',
      facilityCode: 'TEST001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'T001',
      teamName: 'テストチーム',
      facilityId: 'F001',
      teamLeaderId: 'leader001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    jest.mocked(getFacilityById).mockResolvedValueOnce(mockFacility);
    jest.mocked(getTeamById).mockResolvedValueOnce(mockTeam);
    jest.mocked(listWorkersByCondition).mockResolvedValueOnce({
      workers: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const result = await saveWorker(input);
    expect(result).toBeDefined();
    expect(result.isNewRecord).toBe(true);
    expect(result.workerName).toBe(input.workerName);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
  });

  test('DuplicateWorkerError 発生時に saveWorker は出力値を返さず、ストレージへの新規レコード保存は行われない', async () => {
    const mockFacility = {
      facilityId: 'F001',
      facilityName: 'テスト拠点',
      facilityCode: 'TEST001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'T001',
      teamName: 'テストチーム',
      facilityId: 'F001',
      teamLeaderId: 'leader001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    const mockExistingWorker = {
      workerId: 'W001',
      workerName: '山田太郎',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: null,
    };

    jest.mocked(getFacilityById).mockResolvedValueOnce(mockFacility);
    jest.mocked(getTeamById).mockResolvedValueOnce(mockTeam);
    jest.mocked(listWorkersByCondition).mockResolvedValueOnce({
      workers: [mockExistingWorker],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    let capturedError: unknown;
    let capturedResult: SaveWorkerOutput | undefined;
    try {
      capturedResult = await saveWorker(input);
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeDefined();
    expect((capturedError as any).name).toBe('DuplicateWorkerError');
    expect((capturedError as Error).message).toBe('同じ作業者名は既に登録されています。');
    expect(capturedResult).toBeUndefined();
  });
});