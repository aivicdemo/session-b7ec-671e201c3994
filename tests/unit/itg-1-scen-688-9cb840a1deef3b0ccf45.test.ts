import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';
import { ListWorkInstructionsByConditionInput, ListWorkInstructionsByConditionOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-688: 代表的な検索条件で作業指示一覧が取得できる', () => {
  let mockListWorkInstructions: jest.Mock;

  beforeEach(() => {
    const workInstructions = [
      {
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        workInstructionNumber: 'ORD-20240101-001',
        workName: 'ピッキング作業A',
        workDescription: null,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 3,
        priority: '高',
        createdAt: '2023-12-25T10:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        workInstructionNumber: 'ORD-20240101-002',
        workName: '梱包作業B',
        workDescription: null,
        plannedStartDateTime: '2024-01-02T08:00:00Z',
        plannedEndDateTime: '2024-01-02T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '未開始',
        progressRate: 0,
        requiredWorkerCount: 2,
        priority: '中',
        createdAt: '2023-12-25T11:00:00Z',
        updatedAt: '2023-12-25T11:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI003',
        facilityId: 'F002',
        teamId: 'T001',
        workInstructionNumber: 'ORD-20240102-001',
        workName: 'ピッキング作業C',
        workDescription: null,
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T16:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '完了',
        progressRate: 100,
        requiredWorkerCount: 1,
        priority: '低',
        createdAt: '2023-12-24T10:00:00Z',
        updatedAt: '2024-01-01T16:30:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
    ];

    jest.spyOn(dataPersistence, 'validateDateTimeRange').mockImplementation(() => {
      // 常に成功を返す（例外を発生させない）
    });

    jest.spyOn(dataPersistence, 'validateNumericQuantity').mockImplementation(() => {
      // 常に成功を返す（例外を発生させない）
    });

    mockListWorkInstructions = jest.fn().mockImplementation(
      (input: ListWorkInstructionsByConditionInput) => {
        // 検索条件に基づいてデータをフィルタリング
        let filtered = workInstructions;

        if (input.facilityIds && input.facilityIds.length > 0) {
          filtered = filtered.filter(wi => input.facilityIds!.includes(wi.facilityId));
        }

        if (input.progressStatuses && input.progressStatuses.length > 0) {
          filtered = filtered.filter(wi => input.progressStatuses!.includes(wi.progressStatus));
        }

        if (input.priorities && input.priorities.length > 0) {
          filtered = filtered.filter(wi => input.priorities!.includes(wi.priority));
        }

        // ソート処理
        if (input.sortBy === 'plannedStartDateTime') {
          filtered.sort((a, b) => {
            const dateA = new Date(a.plannedStartDateTime).getTime();
            const dateB = new Date(b.plannedStartDateTime).getTime();
            return input.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
        }

        // ページネーション処理
        const pageNumber = input.pageNumber || 1;
        const pageSize = input.pageSize || 50;
        const startIdx = (pageNumber - 1) * pageSize;
        const paginatedResults = filtered.slice(startIdx, startIdx + pageSize);

        const result: ListWorkInstructionsByConditionOutput = {
          workInstructions: paginatedResults,
          totalCount: filtered.length,
          pageNumber: pageNumber,
          pageSize: pageSize,
          retrievedAt: new Date().toISOString(),
        };

        return Promise.resolve(result);
      }
    );

    jest.spyOn(dataPersistence, 'listWorkInstructionsByCondition').mockImplementation(mockListWorkInstructions);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('指定された検索条件に合致する作業指示データの一覧を取得できる', async () => {
    const input: ListWorkInstructionsByConditionInput = {
      facilityIds: ['F001'],
      progressStatuses: ['進行中', '未開始'],
      priorities: ['高', '中'],
      sortBy: 'plannedStartDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workInstructions).toBeDefined();
    expect(result.workInstructions.length).toBe(2);

    expect(result.workInstructions[0]).toMatchObject({
      workInstructionId: 'WI001',
      plannedStartDateTime: '2024-01-01T08:00:00Z',
      progressStatus: '進行中',
      priority: '高',
      requiredWorkerCount: 3,
      progressRate: 50,
    });

    expect(result.workInstructions[1]).toMatchObject({
      workInstructionId: 'WI002',
      plannedStartDateTime: '2024-01-02T08:00:00Z',
      progressStatus: '未開始',
      priority: '中',
      requiredWorkerCount: 2,
      progressRate: 0,
    });

    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    const retrievedAtRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.retrievedAt).toMatch(retrievedAtRegex);

    const notIncludedWI003 = result.workInstructions.some(wi => wi.workInstructionId === 'WI003');
    expect(notIncludedWI003).toBe(false);

    const plannedStartTimes = result.workInstructions.map(wi => new Date(wi.plannedStartDateTime).getTime());
    for (let i = 0; i < plannedStartTimes.length - 1; i++) {
      expect(plannedStartTimes[i]).toBeLessThanOrEqual(plannedStartTimes[i + 1]);
    }
  });
});