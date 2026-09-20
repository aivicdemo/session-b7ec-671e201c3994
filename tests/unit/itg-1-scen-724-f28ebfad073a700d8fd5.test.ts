import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import type { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-724: 作業者IDで検索して合致するデータが返される', () => {
  let mockWorkResults: GetWorkResultByIdOutput[];

  beforeEach(() => {
    mockWorkResults = [
      {
        workResultId: 'result-001',
        workInstructionId: 'instr-001',
        workerId: 'WORKER-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 50,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Normal completion',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-002',
        workInstructionId: 'instr-002',
        workerId: 'WORKER-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T10:30:00Z',
        actualEndDateTime: '2024-01-15T12:30:00Z',
        actualQuantity: 48,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Completed on time',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:45:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-003',
        workInstructionId: 'instr-003',
        workerId: 'WORKER-001',
        facilityId: 'facility-002',
        teamId: 'team-002',
        actualStartDateTime: '2024-01-16T08:00:00Z',
        actualEndDateTime: '2024-01-16T10:00:00Z',
        actualQuantity: 52,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'High quality',
        createdAt: '2024-01-16T07:00:00Z',
        updatedAt: '2024-01-16T10:15:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
      {
        workResultId: 'result-004',
        workInstructionId: 'instr-004',
        workerId: 'WORKER-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-16T13:00:00Z',
        actualEndDateTime: '2024-01-16T15:00:00Z',
        actualQuantity: 45,
        workStatus: 'completed',
        defectCount: 3,
        remarks: 'Some issues encountered',
        createdAt: '2024-01-16T12:00:00Z',
        updatedAt: '2024-01-16T15:30:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-005',
        workInstructionId: 'instr-005',
        workerId: 'WORKER-001',
        facilityId: 'facility-003',
        teamId: 'team-003',
        actualStartDateTime: '2024-01-17T08:00:00Z',
        actualEndDateTime: '2024-01-17T11:00:00Z',
        actualQuantity: 55,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Completed ahead of schedule',
        createdAt: '2024-01-17T07:00:00Z',
        updatedAt: '2024-01-17T11:15:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
      {
        workResultId: 'result-006',
        workInstructionId: 'instr-006',
        workerId: 'WORKER-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T09:30:00Z',
        actualQuantity: 30,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'WORKER-002 result 1',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T09:45:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-007',
        workInstructionId: 'instr-007',
        workerId: 'WORKER-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        actualStartDateTime: '2024-01-16T08:00:00Z',
        actualEndDateTime: '2024-01-16T09:30:00Z',
        actualQuantity: 32,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'WORKER-002 result 2',
        createdAt: '2024-01-16T07:00:00Z',
        updatedAt: '2024-01-16T09:45:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-008',
        workInstructionId: 'instr-008',
        workerId: 'WORKER-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-17T08:00:00Z',
        actualEndDateTime: '2024-01-17T09:30:00Z',
        actualQuantity: 31,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'WORKER-002 result 3',
        createdAt: '2024-01-17T07:00:00Z',
        updatedAt: '2024-01-17T09:45:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
      {
        workResultId: 'result-009',
        workInstructionId: 'instr-009',
        workerId: 'WORKER-003',
        facilityId: 'facility-003',
        teamId: 'team-003',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 40,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Other worker result 1',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'result-010',
        workInstructionId: 'instr-010',
        workerId: 'WORKER-004',
        facilityId: 'facility-002',
        teamId: 'team-002',
        actualStartDateTime: '2024-01-16T08:00:00Z',
        actualEndDateTime: '2024-01-16T10:00:00Z',
        actualQuantity: 38,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Other worker result 2',
        createdAt: '2024-01-16T07:00:00Z',
        updatedAt: '2024-01-16T10:15:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
    ];
  });

  it('should return work results matching the specified worker ID', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['WORKER-001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBe(5);

    result.workResults.forEach((record) => {
      expect(record.workerId).toBe('WORKER-001');
    });

    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate).toBeInstanceOf(Date);
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);

    const worker002Result = result.workResults.find(
      (r) => r.workerId === 'WORKER-002'
    );
    expect(worker002Result).toBeUndefined();

    const worker003Result = result.workResults.find(
      (r) => r.workerId === 'WORKER-003'
    );
    expect(worker003Result).toBeUndefined();
  });

  it('should not include records for workers not in the filter', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['WORKER-001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    const allWorkerIds = new Set(result.workResults.map((r) => r.workerId));
    expect(allWorkerIds.size).toBe(1);
    expect(allWorkerIds.has('WORKER-001')).toBe(true);
    expect(allWorkerIds.has('WORKER-002')).toBe(false);
    expect(allWorkerIds.has('WORKER-003')).toBe(false);
    expect(allWorkerIds.has('WORKER-004')).toBe(false);
  });

  it('should return pagination information correctly', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['WORKER-001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.totalCount).toBe(5);
  });

  it('should return all fields of GetWorkResultByIdOutput for each record', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['WORKER-001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    result.workResults.forEach((record) => {
      expect(record.workResultId).toBeDefined();
      expect(record.workInstructionId).toBeDefined();
      expect(record.workerId).toBeDefined();
      expect(record.facilityId).toBeDefined();
      expect(record.teamId).toBeDefined();
      expect(record.actualStartDateTime).toBeDefined();
      expect(record.actualEndDateTime).toBeDefined();
      expect(record.actualQuantity).toBeDefined();
      expect(record.workStatus).toBeDefined();
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.createdBy).toBeDefined();
    });
  });
});