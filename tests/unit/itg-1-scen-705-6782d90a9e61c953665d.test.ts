import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-705: 実績数量が負数だとInvalidWorkResultDataエラーが発生する', () => {
  beforeEach(() => {
    // 作業指示、作業者、拠点、チームが全て存在するものとしてスタブ化
    jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FC001',
      teamId: 'TM001',
      workInstructionNumber: 'WI-2024-001',
      workName: 'テスト作業',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T17:00:00Z',
      progressStatus: '進行中',
      requiredWorkerCount: 1,
      priority: '中',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR001',
    });

    jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
      workerId: 'WK001',
      workerName: 'テスト作業者',
      facilityId: 'FC001',
      teamId: 'TM001',
      jobType: 'オペレータ',
      operatingStatus: '稼働中',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR001',
    });

    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
      facilityId: 'FC001',
      facilityName: 'テスト拠点',
      facilityCode: 'FC-001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: '稼働中',
      responsiblePersonName: '責任者',
      contactInfo: '000-0000-0000',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR001',
    });

    jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
      teamId: 'TM001',
      teamName: 'テストチーム',
      facilityId: 'FC001',
      teamLeaderId: 'WK001',
      operatingStatus: '稼働中',
      capacity: 10,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR001',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidWorkResultData error when actualQuantity is negative', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI001',
      workerId: 'WK001',
      facilityId: 'FC001',
      teamId: 'TM001',
      actualStartDateTime: '2024-01-15T09:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: -5,
      workStatus: '進行中',
      defectCount: null,
      remarks: null,
      createdBy: 'USR001',
      updatedBy: null,
    };

    const error = await saveWorkResult(input).catch((e: any) => e);
    
    expect(error).toEqual(expect.any(Error));
    expect(error.name).toBe('InvalidWorkResultData');
    expect(error.message).toBe('作業実績データが不正です。実績数量: -5, 開始: 2024-01-15T09:00:00Z, 終了: 2024-01-15T10:00:00Z');
  });
});