import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-734: 複数の検索条件を組み合わせて絞り込んだデータが返される', () => {
  let mockWorkResults: GetWorkResultByIdOutput[];

  beforeEach(() => {
    mockWorkResults = [
      {
        workResultId: 'WR001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T09:30:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: 2,
        remarks: undefined,
        createdAt: '2024-01-15T07:50:00Z',
        updatedAt: '2024-01-15T09:35:00Z',
        createdBy: 'USER001',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR002',
        workInstructionId: 'WI001',
        workerId: 'W002',
        facilityId: 'F001',
        teamId: 'T001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T11:00:00Z',
        actualQuantity: 150,
        workStatus: '進行中',
        defectCount: 5,
        remarks: undefined,
        createdAt: '2024-01-15T08:50:00Z',
        updatedAt: '2024-01-15T10:50:00Z',
        createdBy: 'USER001',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR003',
        workInstructionId: 'WI002',
        workerId: 'W001',
        facilityId: 'F002',
        teamId: 'T002',
        actualStartDateTime: '2024-01-16T08:00:00Z',
        actualEndDateTime: '2024-01-16T09:00:00Z',
        actualQuantity: 80,
        workStatus: '完了',
        defectCount: 1,
        remarks: undefined,
        createdAt: '2024-01-16T07:50:00Z',
        updatedAt: '2024-01-16T09:05:00Z',
        createdBy: 'USER001',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR004',
        workInstructionId: 'WI003',
        workerId: 'W003',
        facilityId: 'F001',
        teamId: 'T002',
        actualStartDateTime: '2024-01-15T10:00:00Z',
        actualEndDateTime: '2024-01-15T10:30:00Z',
        actualQuantity: 50,
        workStatus: '中断',
        defectCount: 10,
        remarks: undefined,
        createdAt: '2024-01-15T09:50:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
        createdBy: 'USER001',
        updatedBy: undefined,
      },
    ];
  });

  it('複合検索条件で絞り込んだ作業実績データが正しく返される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workResults).toHaveLength(1);
    expect(result.workResults[0]).toMatchObject({
      workResultId: 'WR001',
      workInstructionId: 'WI001',
      workerId: 'W001',
      facilityId: 'F001',
      teamId: 'T001',
      actualStartDateTime: '2024-01-15T08:00:00Z',
      actualEndDateTime: '2024-01-15T09:30:00Z',
      actualQuantity: 100,
      workStatus: '完了',
      defectCount: 2,
    });
    expect(result.totalCount).toBe(1);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it('workerIds条件に合致しないレコード（W002）は除外される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.workResults.some(wr => wr.workerId === 'W002')).toBe(false);
  });

  it('workStatuses条件に合致しないレコード（進行中、中断）は除外される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.workResults.every(wr => wr.workStatus === '完了')).toBe(true);
  });

  it('facilityIds条件に合致しないレコード（F002）は除外される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.workResults.some(wr => wr.facilityId === 'F002')).toBe(false);
  });

  it('actualQuantity数値範囲条件に合致しないレコード（50）は除外される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.workResults.every(wr => wr.actualQuantity >= 80 && wr.actualQuantity <= 150)).toBe(true);
  });

  it('actualStartDateTime範囲条件に合致しないレコード（2024-01-16）は除外される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.workResults.every(wr => {
      const startTime = new Date(wr.actualStartDateTime);
      const fromTime = new Date('2024-01-15T00:00:00Z');
      const toTime = new Date('2024-01-15T23:59:59Z');
      return startTime >= fromTime && startTime <= toTime;
    })).toBe(true);
  });

  it('ソート順序（ASC）が正しく適用される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    if (result.workResults.length > 1) {
      for (let i = 0; i < result.workResults.length - 1; i++) {
        const current = new Date(result.workResults[i].actualStartDateTime);
        const next = new Date(result.workResults[i + 1].actualStartDateTime);
        expect(current <= next).toBe(true);
      }
    }
  });

  it('ページング情報が正しく返される', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('retrievedAtがISO 8601形式であること', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['完了'],
      minActualQuantity: 80,
      maxActualQuantity: 150,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });
});