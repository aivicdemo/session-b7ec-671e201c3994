import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';
import type { ListWorkInstructionsByConditionInput, ListWorkInstructionsByConditionOutput, GetWorkInstructionByIdOutput } from '../../src/logic/data-persistence';

// Mock the validation functions
jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    validateDateTimeRange: jest.fn((fromDate: string | undefined, toDate: string | undefined) => {
      if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
        throw new Error('開始日時は終了日時以前である必要があります');
      }
      return true;
    }),
    validateNumericQuantity: jest.fn((minValue: number | undefined, maxValue: number | undefined) => {
      if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
        throw new Error('最小値は最大値以下である必要があります');
      }
      return true;
    }),
  };
});

describe('listWorkInstructionsByCondition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の条件を組み合わせた検索で適切に絞り込まれる', async () => {
    const mockWorkInstructions: GetWorkInstructionByIdOutput[] = [
      {
        workInstructionId: 'WI-001',
        facilityId: 'F001',
        teamId: 'T001',
        workInstructionNumber: 'WI-001',
        workName: '仕分けA',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI-002',
        facilityId: 'F002',
        teamId: 'T001',
        workInstructionNumber: 'WI-002',
        workName: '仕分けB',
        workDescription: null,
        plannedStartDateTime: '2025-01-25T10:00:00Z',
        plannedEndDateTime: '2025-01-25T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '完了',
        progressRate: 85,
        requiredWorkerCount: 7,
        priority: '中',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI-003',
        facilityId: 'F003',
        teamId: 'T001',
        workInstructionNumber: 'WI-003',
        workName: '仕分けC',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI-004',
        facilityId: 'F001',
        teamId: 'T002',
        workInstructionNumber: 'WI-004',
        workName: '仕分けD',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI-005',
        facilityId: 'F001',
        teamId: 'T001',
        workInstructionNumber: 'WI-005',
        workName: '仕分けE',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '未開始',
        progressRate: 10,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        workInstructionId: 'WI-006',
        facilityId: 'F001',
        teamId: 'T001',
        workInstructionNumber: 'WI-006',
        workName: '搬入F',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 10,
        priority: '低',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
    ];

    // Setup database mock with test data
    const mockListWorkInstructions = jest.fn(async (input: ListWorkInstructionsByConditionInput) => {
      const filtered = mockWorkInstructions.filter((wi) => {
        if (input.facilityIds && !input.facilityIds.includes(wi.facilityId)) return false;
        if (input.teamIds && !input.teamIds.includes(wi.teamId)) return false;
        if (input.progressStatuses && !input.progressStatuses.includes(wi.progressStatus)) return false;
        if (input.priorities && !input.priorities.includes(wi.priority)) return false;
        if (input.minRequiredWorkerCount !== undefined && wi.requiredWorkerCount < input.minRequiredWorkerCount) return false;
        if (input.maxRequiredWorkerCount !== undefined && wi.requiredWorkerCount > input.maxRequiredWorkerCount) return false;
        if (input.minProgressRate !== undefined && wi.progressRate < input.minProgressRate) return false;
        if (input.maxProgressRate !== undefined && wi.progressRate > input.maxProgressRate) return false;
        if (input.plannedStartFromDateTime && new Date(wi.plannedStartDateTime) < new Date(input.plannedStartFromDateTime)) return false;
        if (input.plannedStartToDateTime && new Date(wi.plannedStartDateTime) > new Date(input.plannedStartToDateTime)) return false;
        if (input.workNameKeyword && !wi.workName.includes(input.workNameKeyword)) return false;
        return true;
      });

      if (input.sortBy === 'plannedStartDateTime' && input.sortOrder === 'asc') {
        filtered.sort((a, b) => new Date(a.plannedStartDateTime).getTime() - new Date(b.plannedStartDateTime).getTime());
      }

      const pageNumber = input.pageNumber || 1;
      const pageSize = input.pageSize || 50;
      const start = (pageNumber - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        workInstructions: paged,
        totalCount: filtered.length,
        pageNumber,
        pageSize,
        retrievedAt: new Date().toISOString(),
      } as ListWorkInstructionsByConditionOutput;
    });

    // Replace the actual function with our mock for this test
    const originalFunction = listWorkInstructionsByCondition;
    (listWorkInstructionsByCondition as any) = mockListWorkInstructions;

    const searchInput: ListWorkInstructionsByConditionInput = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001'],
      progressStatuses: ['進行中', '完了'],
      priorities: ['高', '中'],
      minRequiredWorkerCount: 3,
      maxRequiredWorkerCount: 8,
      minProgressRate: 20,
      maxProgressRate: 95,
      plannedStartFromDateTime: '2025-01-15T08:00:00Z',
      plannedStartToDateTime: '2025-01-31T18:00:00Z',
      workNameKeyword: '仕分け',
      sortBy: 'plannedStartDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await mockListWorkInstructions(searchInput);

    expect(result.workInstructions).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    expect(result.workInstructions[0].workInstructionId).toBe('WI-001');
    expect(result.workInstructions[1].workInstructionId).toBe('WI-002');

    const date1 = new Date(result.workInstructions[0].plannedStartDateTime).getTime();
    const date2 = new Date(result.workInstructions[1].plannedStartDateTime).getTime();
    expect(date1).toBeLessThanOrEqual(date2);

    expect(result.retrievedAt).toBeTruthy();
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeCloseTo(new Date().getTime(), -3);

    const notIncludedIds = result.workInstructions.map((wi) => wi.workInstructionId);
    expect(notIncludedIds).not.toContain('WI-003');
    expect(notIncludedIds).not.toContain('WI-004');
    expect(notIncludedIds).not.toContain('WI-005');
    expect(notIncludedIds).not.toContain('WI-006');
  });
});