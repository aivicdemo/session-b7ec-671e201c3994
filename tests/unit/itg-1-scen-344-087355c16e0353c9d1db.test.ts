import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-344: 作業実績データ集約・正規化・生産性指標計算と永続化', () => {
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockCalculateProductivityRate: jest.Mock;
  let mockCalculateWorkHours: jest.Mock;
  let mockJudgeProficiencyLevel: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetProficiencyById: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateDateTimeRange = jest.fn().mockResolvedValue(undefined);
    mockValidateNumericQuantity = jest.fn().mockResolvedValue(undefined);
    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue(undefined);
    
    mockCalculateProductivityRate = jest.fn((completedCount, plannedHours) => {
      if (plannedHours === 0) return 0;
      return Math.min(completedCount / (plannedHours * 100), 1);
    });
    
    mockCalculateWorkHours = jest.fn((startDateTime, endDateTime) => {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });
    
    mockJudgeProficiencyLevel = jest.fn((errorCount, completedQuantity) => {
      const errorRate = errorCount / Math.max(completedQuantity, 1);
      if (errorRate > 0.05) return 'beginner';
      if (errorRate > 0.02) return 'intermediate';
      return 'advanced';
    });
    
    mockGetWorkerById = jest.fn((workerId) => {
      return Promise.resolve({
        workerId,
        workerName: `Worker ${workerId}`,
      });
    });
    
    mockGetWorkInstructionById = jest.fn((instructionId) => {
      return Promise.resolve({
        workInstructionId: instructionId,
        workName: `Work ${instructionId}`,
      });
    });
    
    mockGetProficiencyById = jest.fn((workerId) => {
      return Promise.resolve({
        proficiencyId: `prof-${workerId}`,
        proficiencyLevel: 3,
      });
    });
    
    mockSaveProductivityData = jest.fn().mockResolvedValue({
      savedProductivityRecords: 3,
      savedWorkResultRecords: 2,
    });
    
    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);

    (global as any).validateDateTimeRange = mockValidateDateTimeRange;
    (global as any).validateNumericQuantity = mockValidateNumericQuantity;
    (global as any).validateReferentialIntegrity = mockValidateReferentialIntegrity;
    (global as any).calculateProductivityRate = mockCalculateProductivityRate;
    (global as any).calculateWorkHours = mockCalculateWorkHours;
    (global as any).judgeProficiencyLevel = mockJudgeProficiencyLevel;
    (global as any).getWorkerById = mockGetWorkerById;
    (global as any).getWorkInstructionById = mockGetWorkInstructionById;
    (global as any).getProficiencyById = mockGetProficiencyById;
    (global as any).saveProductivityData = mockSaveProductivityData;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
  });

  it('ハンディターミナルとWMSの作業実績データを集約・正規化し、生産性指標を計算して永続化する', async () => {
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'instruction-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:30:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        errorCount: 2,
        remarks: 'Completed successfully',
      },
      {
        workInstructionId: 'instruction-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:30:00Z',
        completedQuantity: 95,
        defectQuantity: 3,
        errorCount: 1,
        remarks: 'Minor issues resolved',
      },
      {
        workInstructionId: 'instruction-003',
        workerId: 'worker-003',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 110,
        defectQuantity: 4,
        errorCount: 0,
        remarks: 'Excellent performance',
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'instruction-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:30:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        remarks: 'WMS recorded',
      },
      {
        workInstructionId: 'instruction-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:30:00Z',
        completedQuantity: 95,
        defectQuantity: 3,
        remarks: 'WMS recorded',
      },
      {
        workInstructionId: 'instruction-003',
        workerId: 'worker-003',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 110,
        defectQuantity: 4,
        remarks: 'WMS recorded',
      },
    ];

    const input = {
      handyTerminalWorkResults,
      wmsWorkResults,
      aggregationDate: '2024-01-15',
      executingUserId: 'user-001',
    };

    const result = await aggregateWorkResultsAndCalculateProductivity(input);

    expect(result).toBeDefined();

    expect(result.aggregatedProductivityData).toHaveLength(3);

    result.aggregatedProductivityData.forEach((record, index) => {
      expect(record).toHaveProperty('productivityDataId');
      expect(record.productivityDataId).toBeTruthy();
      expect(typeof record.productivityDataId).toBe('string');
      expect(record.productivityDataId.length).toBeGreaterThan(0);
      
      expect(record).toHaveProperty('workResultId');
      expect(record).toHaveProperty('workerId');
      expect(record).toHaveProperty('facilityId');
      expect(record).toHaveProperty('teamId');
      
      expect(record.workDate).toBe('2024-01-15');
      
      expect(record).toHaveProperty('plannedWorkHours');
      expect(typeof record.plannedWorkHours).toBe('number');
      
      expect(record).toHaveProperty('actualWorkHours');
      expect(typeof record.actualWorkHours).toBe('number');
      expect(record.actualWorkHours).toBeGreaterThan(0);
      
      expect(record).toHaveProperty('completedCount');
      expect(typeof record.completedCount).toBe('number');
      
      expect(record).toHaveProperty('productivityRate');
      expect(typeof record.productivityRate).toBe('number');
      expect(record.productivityRate).toBeGreaterThanOrEqual(0);
      expect(record.productivityRate).toBeLessThanOrEqual(1);
      
      expect(record).toHaveProperty('qualityScore');
      expect(typeof record.qualityScore).toBe('number');
      
      expect(record).toHaveProperty('errorCount');
      expect(typeof record.errorCount).toBe('number');
      
      expect(record).toHaveProperty('proficiencyLevel');
      expect(['beginner', 'intermediate', 'advanced']).toContain(record.proficiencyLevel);
      
      expect(record).toHaveProperty('createdDateTime');
      const createdTime = new Date(record.createdDateTime).getTime();
      expect(createdTime).toBeGreaterThan(0);
    });

    expect(result.dataConflicts).toBeDefined();
    expect(Array.isArray(result.dataConflicts)).toBe(true);
    expect(result.dataConflicts).toHaveLength(0);

    expect(result.processingStatistics).toBeDefined();
    expect(result.processingStatistics.totalRecordsProcessed).toBe(6);
    expect(result.processingStatistics.successfullyAggregated).toBe(6);
    expect(result.processingStatistics.failedRecords).toBe(0);
    expect(result.processingStatistics.conflictRecords).toBe(0);
    expect(result.processingStatistics.processingDurationMs).toBeGreaterThan(0);

    expect(result.persistenceResult).toBeDefined();
    expect(result.persistenceResult.savedProductivityRecords).toBe(3);
    expect(result.persistenceResult.savedWorkResultRecords).toBe(2);
    expect(result.persistenceResult.persistenceStatus).toBe('success');

    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
    expect(mockCalculateProductivityRate).toHaveBeenCalled();
    expect(mockCalculateWorkHours).toHaveBeenCalled();
    expect(mockJudgeProficiencyLevel).toHaveBeenCalled();
    expect(mockGetWorkerById).toHaveBeenCalled();
    expect(mockGetWorkInstructionById).toHaveBeenCalled();
    expect(mockGetProficiencyById).toHaveBeenCalled();
    expect(mockSaveProductivityData).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
      })
    );
  });
});