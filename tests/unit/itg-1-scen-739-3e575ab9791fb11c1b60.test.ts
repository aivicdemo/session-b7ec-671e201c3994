import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';
import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-739: 検索条件に合致する全レコード数がtotalCountに返される', () => {
  const mockWorkResultRecords: GetWorkResultByIdOutput[] = [
    {
      workResultId: 'result-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T09:00:00Z',
      actualEndDateTime: '2024-01-01T10:00:00Z',
      actualQuantity: 50,
      workStatus: 'completed',
      defectCount: 2,
      remarks: 'Sample work result 1',
      createdAt: '2024-01-01T08:00:00Z',
      updatedAt: '2024-01-01T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    },
    {
      workResultId: 'result-002',
      workInstructionId: 'instr-002',
      workerId: 'worker-002',
      facilityId: 'facility-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T11:00:00Z',
      actualEndDateTime: '2024-01-01T12:00:00Z',
      actualQuantity: 45,
      workStatus: 'completed',
      defectCount: 1,
      remarks: 'Sample work result 2',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T12:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    },
    {
      workResultId: 'result-003',
      workInstructionId: 'instr-003',
      workerId: 'worker-003',
      facilityId: 'facility-002',
      teamId: 'team-002',
      actualStartDateTime: '2024-01-01T13:00:00Z',
      actualEndDateTime: '2024-01-01T14:00:00Z',
      actualQuantity: 55,
      workStatus: 'in_progress',
      remarks: 'Sample work result 3',
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T14:30:00Z',
      createdBy: 'user-001',
    },
  ];

  beforeAll(() => {
    const mockListWorkResultsByCondition = jest.fn(async (input: ListWorkResultsByConditionInput) => {
      let filteredResults = [...mockWorkResultRecords];

      if (input.workResultIds && input.workResultIds.length > 0) {
        filteredResults = filteredResults.filter(r => input.workResultIds!.includes(r.workResultId));
      }
      if (input.workInstructionIds && input.workInstructionIds.length > 0) {
        filteredResults = filteredResults.filter(r => input.workInstructionIds!.includes(r.workInstructionId));
      }
      if (input.workerIds && input.workerIds.length > 0) {
        filteredResults = filteredResults.filter(r => input.workerIds!.includes(r.workerId));
      }
      if (input.facilityIds && input.facilityIds.length > 0) {
        filteredResults = filteredResults.filter(r => input.facilityIds!.includes(r.facilityId));
      }
      if (input.teamIds && input.teamIds.length > 0) {
        filteredResults = filteredResults.filter(r => input.teamIds!.includes(r.teamId));
      }
      if (input.workStatuses && input.workStatuses.length > 0) {
        filteredResults = filteredResults.filter(r => input.workStatuses!.includes(r.workStatus));
      }

      if (input.minActualQuantity !== null && input.minActualQuantity !== undefined) {
        filteredResults = filteredResults.filter(r => r.actualQuantity >= input.minActualQuantity!);
      }
      if (input.maxActualQuantity !== null && input.maxActualQuantity !== undefined) {
        filteredResults = filteredResults.filter(r => r.actualQuantity <= input.maxActualQuantity!);
      }

      if (input.minDefectCount !== null && input.minDefectCount !== undefined) {
        filteredResults = filteredResults.filter(r => (r.defectCount ?? 0) >= input.minDefectCount!);
      }
      if (input.maxDefectCount !== null && input.maxDefectCount !== undefined) {
        filteredResults = filteredResults.filter(r => (r.defectCount ?? 0) <= input.maxDefectCount!);
      }

      if (input.actualStartFromDateTime) {
        filteredResults = filteredResults.filter(r => new Date(r.actualStartDateTime) >= new Date(input.actualStartFromDateTime!));
      }
      if (input.actualStartToDateTime) {
        filteredResults = filteredResults.filter(r => new Date(r.actualStartDateTime) <= new Date(input.actualStartToDateTime!));
      }
      if (input.actualEndFromDateTime) {
        filteredResults = filteredResults.filter(r => new Date(r.actualEndDateTime) >= new Date(input.actualEndFromDateTime!));
      }
      if (input.actualEndToDateTime) {
        filteredResults = filteredResults.filter(r => new Date(r.actualEndDateTime) <= new Date(input.actualEndToDateTime!));
      }

      if (input.createdFromDate) {
        filteredResults = filteredResults.filter(r => new Date(r.createdAt) >= new Date(input.createdFromDate!));
      }
      if (input.createdToDate) {
        filteredResults = filteredResults.filter(r => new Date(r.createdAt) <= new Date(input.createdToDate!));
      }
      if (input.updatedFromDate) {
        filteredResults = filteredResults.filter(r => new Date(r.updatedAt) >= new Date(input.updatedFromDate!));
      }
      if (input.updatedToDate) {
        filteredResults = filteredResults.filter(r => new Date(r.updatedAt) <= new Date(input.updatedToDate!));
      }

      const totalCount = filteredResults.length;

      if (input.sortBy && input.sortOrder) {
        filteredResults.sort((a, b) => {
          const aValue = (a as any)[input.sortBy!];
          const bValue = (b as any)[input.sortBy!];
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return input.sortOrder === 'DESC' ? -comparison : comparison;
        });
      }

      const pageNumber = input.pageNumber || 1;
      const pageSize = input.pageSize || 50;
      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedResults = filteredResults.slice(startIndex, startIndex + pageSize);

      return {
        workResults: paginatedResults,
        totalCount,
        pageNumber,
        pageSize,
        retrievedAt: new Date().toISOString(),
      } as ListWorkResultsByConditionOutput;
    });

    (listWorkResultsByCondition as jest.Mock).mockImplementation(mockListWorkResultsByCondition);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return totalCount with all matching records count regardless of pagination', async () => {
    expect(mockWorkResultRecords.length).toBe(3);

    const input: ListWorkResultsByConditionInput = {
      pageNumber: 1,
      pageSize: 2,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      workResultIds: undefined,
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
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.totalCount).toBe(3);
    expect(result.workResults).toHaveLength(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.workResults[0].actualStartDateTime).toBeLessThanOrEqual(
      result.workResults[1].actualStartDateTime
    );

    expect(result.workResults[0]).toMatchObject({
      workResultId: expect.any(String),
      workInstructionId: expect.any(String),
      workerId: expect.any(String),
      facilityId: expect.any(String),
      teamId: expect.any(String),
      actualStartDateTime: expect.any(String),
      actualEndDateTime: expect.any(String),
      actualQuantity: expect.any(Number),
      workStatus: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: expect.any(String),
    });

    expect(result.workResults[1]).toMatchObject({
      workResultId: expect.any(String),
      workInstructionId: expect.any(String),
      workerId: expect.any(String),
      facilityId: expect.any(String),
      teamId: expect.any(String),
      actualStartDateTime: expect.any(String),
      actualEndDateTime: expect.any(String),
      actualQuantity: expect.any(Number),
      workStatus: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: expect.any(String),
    });
  });
});