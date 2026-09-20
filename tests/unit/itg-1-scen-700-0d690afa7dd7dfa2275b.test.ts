import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-700: 既存の作業実績IDを指定して更新すると、作業実績が更新されてisNewRecord=falseを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing work result and return isNewRecord=false', async () => {
    // Given: 既存の作業実績レコードを事前に作成
    const existingWorkResultId = 'existing-work-result-id-12345';
    const workInstructionId = 'work-instr-001';
    const workerId = 'worker-001';
    const facilityId = 'facility-001';
    const teamId = 'team-001';
    const actualStartDateTime = '2025-01-15T09:00:00Z';
    const actualEndDateTime = '2025-01-15T17:00:00Z';

    // スタブ化: getWorkInstructionById
    jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue({
      workInstructionId,
      facilityId,
      teamId,
      workInstructionNumber: 'WI-001',
      workName: 'Test Work',
      workDescription: 'Test Description',
      plannedStartDateTime: '2025-01-15T08:00:00Z',
      plannedEndDateTime: '2025-01-15T18:00:00Z',
      progressStatus: '進行中',
      progressRate: 50,
      requiredWorkerCount: 5,
      priority: '高',
      createdAt: '2025-01-14T10:00:00Z',
      updatedAt: '2025-01-14T10:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // スタブ化: getWorkerById
    jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      facilityId,
      teamId,
      jobType: '組立',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // スタブ化: getFacilityById
    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
      facilityId,
      facilityName: 'Test Facility',
      facilityCode: 'FC-001',
      address: '123 Test Street',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: 'Manager',
      contactInfo: '090-1234-5678',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // スタブ化: getTeamById
    jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
      teamId,
      teamName: 'Test Team',
      facilityId,
      teamLeaderId: 'leader-001',
      teamDescription: 'Test Team Description',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // スタブ化: validateNumericQuantity
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockResolvedValue(true);

    // スタブ化: validateDateTimeRange
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockResolvedValue(true);

    // When: saveWorkResultを呼び出す（既存IDを指定して更新）
    const result = await saveWorkResult({
      workResultId: existingWorkResultId,
      workInstructionId,
      workerId,
      facilityId,
      teamId,
      actualStartDateTime,
      actualEndDateTime,
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'user001',
      updatedBy: 'user002',
    });

    // Then: 出力型SaveWorkResultOutputを検証
    expect(result).toBeDefined();
    expect(result.workResultId).toBe(existingWorkResultId);
    expect(result.workInstructionId).toBe(workInstructionId);
    expect(result.workerId).toBe(workerId);
    expect(result.facilityId).toBe(facilityId);
    expect(result.teamId).toBe(teamId);
    expect(result.actualQuantity).toBe(50);
    expect(result.workStatus).toBe('完了');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(false);
  });
});