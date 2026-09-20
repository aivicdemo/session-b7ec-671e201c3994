import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-722: 作業実績IDで検索して合致するデータが返される', () => {
  let mockWorkResults: GetWorkResultByIdOutput[];

  beforeEach(() => {
    mockWorkResults = [
      {
        workResultId: 'WR-001',
        workInstructionId: 'WI-001',
        workerId: 'W-001',
        facilityId: 'F-001',
        teamId: 'T-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: 2,
        remarks: 'テスト実績1',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
      {
        workResultId: 'WR-002',
        workInstructionId: 'WI-002',
        workerId: 'W-002',
        facilityId: 'F-001',
        teamId: 'T-001',
        actualStartDateTime: '2024-01-15T10:00:00Z',
        actualEndDateTime: '2024-01-15T18:00:00Z',
        actualQuantity: 150,
        workStatus: '完了',
        defectCount: 3,
        remarks: 'テスト実績2',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T19:00:00Z',
        createdBy: 'user-002',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'WR-003',
        workInstructionId: 'WI-003',
        workerId: 'W-003',
        facilityId: 'F-002',
        teamId: 'T-002',
        actualStartDateTime: '2024-01-15T11:00:00Z',
        actualEndDateTime: '2024-01-15T19:00:00Z',
        actualQuantity: 120,
        workStatus: '完了',
        defectCount: 1,
        remarks: 'テスト実績3',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T20:00:00Z',
        createdBy: 'user-003',
        updatedBy: 'user-003',
      },
    ];

    jest.clearAllMocks();
  });

  it('指定された作業実績IDで検索し、合致するデータのみを返却する', async () => {
    const input: ListWorkResultsByConditionInput = {
      workResultIds: ['WR-001'],
      workInstructionIds: undefined,
      workerIds: undefined,
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result.workResults).toHaveLength(1);
    expect(result.workResults[0].workResultId).toBe('WR-001');
    expect(result.workResults[0].workInstructionId).toBe('WI-001');
    expect(result.workResults[0].workerId).toBe('W-001');
    expect(result.workResults[0].actualQuantity).toBe(100);
    expect(result.workResults[0].workStatus).toBe('完了');
    expect(result.totalCount).toBe(1);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(result.pageNumber).toBe(1);
    }
    
    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(result.pageSize).toBe(50);
    }
  });

  it('検索条件に合致しないデータは結果に含まれない', async () => {
    const input: ListWorkResultsByConditionInput = {
      workResultIds: ['WR-001'],
      workInstructionIds: undefined,
      workerIds: undefined,
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    const resultIds = result.workResults.map(wr => wr.workResultId);
    expect(resultIds).toContain('WR-001');
    expect(resultIds).not.toContain('WR-002');
    expect(resultIds).not.toContain('WR-003');
  });

  it('出力型のすべての必須フィールドが返却される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workResultIds: ['WR-001'],
      workInstructionIds: undefined,
      workerIds: undefined,
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result).toHaveProperty('workResults');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('返却されるレコードは指定された検索条件の作業実績IDと完全に一致する', async () => {
    const input: ListWorkResultsByConditionInput = {
      workResultIds: ['WR-001'],
      workInstructionIds: undefined,
      workerIds: undefined,
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    result.workResults.forEach(workResult => {
      expect(['WR-001']).toContain(workResult.workResultId);
    });
  });
});