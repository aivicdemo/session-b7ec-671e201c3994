import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-729: 不良数の範囲で検索して合致するデータが返される', () => {
  let testWorkResults: GetWorkResultByIdOutput[];

  beforeEach(async () => {
    testWorkResults = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 3,
        remarks: 'Record below min range',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'w-002',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 7,
        remarks: 'Record within range',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'w-003',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 12,
        remarks: 'Record within range',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'w-004',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 15,
        remarks: 'Record within range at upper bound',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-005',
        workInstructionId: 'wi-005',
        workerId: 'w-005',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 20,
        remarks: 'Record above max range',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
    ];

    for (const workResult of testWorkResults) {
      await (dataPersistence as any).saveWorkResult({
        workResultId: workResult.workResultId,
        workInstructionId: workResult.workInstructionId,
        workerId: workResult.workerId,
        facilityId: workResult.facilityId,
        teamId: workResult.teamId,
        actualStartDateTime: workResult.actualStartDateTime,
        actualEndDateTime: workResult.actualEndDateTime,
        actualQuantity: workResult.actualQuantity,
        workStatus: workResult.workStatus,
        defectCount: workResult.defectCount,
        remarks: workResult.remarks,
        createdBy: workResult.createdBy,
        updatedBy: workResult.updatedBy,
      });
    }
  });

  afterEach(async () => {
    for (const workResult of testWorkResults) {
      await (dataPersistence as any).deleteDataByIdAndType({
        dataType: 'workResult',
        recordId: workResult.workResultId,
        deletedBy: 'test-cleanup',
      });
    }
  });

  it('should validate input parameters and return work results matching defect count range filter', async () => {
    const validateNumericQuantitySpy = jest.spyOn(dataPersistence as any, 'validateNumericQuantity').mockReturnValue(true);

    const input: ListWorkResultsByConditionInput = {
      minDefectCount: 5,
      maxDefectCount: 15,
      pageNumber: 1,
      pageSize: 50,
    };

    validateNumericQuantitySpy.mockReturnValueOnce(true);

    const beforeCallTime = new Date();
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);
    const afterCallTime = new Date();

    expect(validateNumericQuantitySpy).toHaveBeenCalledWith(5);
    expect(validateNumericQuantitySpy).toHaveBeenCalledWith(15);

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);

    expect(result.workResults.length).toBe(3);

    expect(result.workResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workResultId: 'wr-002', defectCount: 7 }),
        expect.objectContaining({ workResultId: 'wr-003', defectCount: 12 }),
        expect.objectContaining({ workResultId: 'wr-004', defectCount: 15 }),
      ])
    );

    for (const workResult of result.workResults) {
      expect(workResult.defectCount).toBeDefined();
      expect(workResult.defectCount).toBeGreaterThanOrEqual(5);
      expect(workResult.defectCount).toBeLessThanOrEqual(15);
    }

    expect(result.workResults.some(r => r.defectCount !== undefined && r.defectCount < 5)).toBe(false);
    expect(result.workResults.some(r => r.defectCount !== undefined && r.defectCount > 15)).toBe(false);

    const resultIds = result.workResults.map(r => r.workResultId);
    expect(resultIds).not.toContain('wr-001');
    expect(resultIds).not.toContain('wr-005');

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    const retrievedAtTime = new Date(result.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime() - 1000);
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterCallTime.getTime() + 1000);

    validateNumericQuantitySpy.mockRestore();
  });
});