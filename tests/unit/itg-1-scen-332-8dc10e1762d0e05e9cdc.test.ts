import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-332: ハンディターミナルとWMSの正常なデータを集約して、生産性指標を計算し永続化する', () => {
  let validateDateTimeRangeStub: jest.Mock;
  let validateNumericQuantityStub: jest.Mock;
  let validateReferentialIntegrityStub: jest.Mock;
  let getWorkerByIdStub: jest.Mock;
  let getWorkInstructionByIdStub: jest.Mock;
  let getProficiencyByIdStub: jest.Mock;
  let calculateProductivityRateStub: jest.Mock;
  let calculateWorkHoursStub: jest.Mock;
  let judgeProficiencyLevelStub: jest.Mock;
  let saveProductivityDataStub: jest.Mock;
  let recordOperationAuditStub: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    validateDateTimeRangeStub = jest.fn().mockReturnValue({ valid: true });
    validateNumericQuantityStub = jest.fn().mockReturnValue({ valid: true });
    validateReferentialIntegrityStub = jest.fn().mockReturnValue({ valid: true });
    
    getWorkerByIdStub = jest.fn().mockImplementation((workerId) => {
      const workers: Record<string, any> = {
        'W001': { workerId: 'W001', name: 'Worker1', facilityId: 'FAC001', teamId: 'TEAM001' },
        'W002': { workerId: 'W002', name: 'Worker2', facilityId: 'FAC001', teamId: 'TEAM001' },
        'W003': { workerId: 'W003', name: 'Worker3', facilityId: 'FAC001', teamId: 'TEAM001' },
      };
      return workers[workerId];
    });

    getWorkInstructionByIdStub = jest.fn().mockImplementation((workInstructionId) => {
      return {
        workInstructionId,
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedWorkHours: 8,
        plannedQuantity: 150,
      };
    });

    getProficiencyByIdStub = jest.fn().mockImplementation((workerId) => {
      const proficiency: Record<string, string> = {
        'W001': '初級',
        'W002': '中級',
        'W003': '上級',
      };
      return { proficiencyLevel: proficiency[workerId] };
    });

    calculateProductivityRateStub = jest.fn().mockImplementation((completedCount, plannedHours, plannedQuantity) => {
      return (completedCount / (plannedQuantity * plannedHours)) * 100;
    });

    calculateWorkHoursStub = jest.fn().mockReturnValue(9.0);

    judgeProficiencyLevelStub = jest.fn().mockImplementation((productivityRate) => {
      if (productivityRate < 10) return '初級';
      if (productivityRate < 15) return '中級';
      return '上級';
    });

    saveProductivityDataStub = jest.fn().mockReturnValue({
      savedProductivityRecords: 3,
      savedWorkResultRecords: 3,
      persistenceStatus: 'success',
    });

    recordOperationAuditStub = jest.fn().mockResolvedValue({ success: true });
  });

  test('ハンディターミナルとWMSから取得した正常なデータを集約し、生産性指標を計算して永続化する', async () => {
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        errorCount: 0,
      },
      {
        workInstructionId: 'WI002',
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 150,
        defectQuantity: 3,
        errorCount: 1,
      },
      {
        workInstructionId: 'WI003',
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 200,
        defectQuantity: 8,
        errorCount: 0,
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 100,
        defectQuantity: 4,
      },
      {
        workInstructionId: 'WI002',
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 150,
        defectQuantity: 3,
      },
      {
        workInstructionId: 'WI003',
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 200,
        defectQuantity: 7,
      },
    ];

    const result = await aggregateWorkResultsAndCalculateProductivity(
      {
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate: '2024-01-15',
        executingUserId: 'ADMIN001',
      },
      {
        validateDateTimeRange: validateDateTimeRangeStub,
        validateNumericQuantity: validateNumericQuantityStub,
        validateReferentialIntegrity: validateReferentialIntegrityStub,
        getWorkerById: getWorkerByIdStub,
        getWorkInstructionById: getWorkInstructionByIdStub,
        getProficiencyById: getProficiencyByIdStub,
        calculateProductivityRate: calculateProductivityRateStub,
        calculateWorkHours: calculateWorkHoursStub,
        judgeProficiencyLevel: judgeProficiencyLevelStub,
        saveProductivityData: saveProductivityDataStub,
        recordOperationAudit: recordOperationAuditStub,
      }
    );

    expect(result.aggregatedProductivityData).toBeDefined();
    expect(result.aggregatedProductivityData).toHaveLength(3);

    const record1 = result.aggregatedProductivityData[0];
    expect(record1.workerId).toBe('W001');
    expect(record1.completedCount).toBe(100);
    expect(record1.plannedWorkHours).toBe(8);
    expect(record1.actualWorkHours).toBe(9.0);
    expect(record1.productivityRate).toBeCloseTo(8.33, 1);
    expect(record1.qualityScore).toBeCloseTo(96.67, 1);
    expect(record1.errorCount).toBe(0);
    expect(record1.proficiencyLevel).toBe('初級');
    expect(record1.workDate).toBe('2024-01-15');
    expect(record1.createdDateTime).toBeDefined();

    const record2 = result.aggregatedProductivityData[1];
    expect(record2.workerId).toBe('W002');
    expect(record2.completedCount).toBe(150);
    expect(record2.productivityRate).toBe(12.5);
    expect(record2.qualityScore).toBe(98.0);
    expect(record2.errorCount).toBe(1);
    expect(record2.proficiencyLevel).toBe('中級');

    const record3 = result.aggregatedProductivityData[2];
    expect(record3.workerId).toBe('W003');
    expect(record3.completedCount).toBe(200);
    expect(record3.productivityRate).toBeCloseTo(16.67, 1);
    expect(record3.qualityScore).toBeCloseTo(95.33, 1);
    expect(record3.errorCount).toBe(0);
    expect(record3.proficiencyLevel).toBe('上級');

    expect(result.dataConflicts).toBeUndefined();

    expect(result.processingStatistics).toBeDefined();
    expect(result.processingStatistics.totalRecordsProcessed).toBe(6);
    expect(result.processingStatistics.successfullyAggregated).toBe(3);
    expect(result.processingStatistics.failedRecords).toBe(0);
    expect(result.processingStatistics.conflictRecords).toBe(0);
    expect(result.processingStatistics.processingDurationMs).toBeGreaterThan(0);

    expect(result.persistenceResult).toBeDefined();
    expect(result.persistenceResult.savedProductivityRecords).toBe(3);
    expect(result.persistenceResult.savedWorkResultRecords).toBe(3);
    expect(result.persistenceResult.persistenceStatus).toBe('success');
  });
});