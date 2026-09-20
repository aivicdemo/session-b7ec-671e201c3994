import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-735: ソート対象フィールドとソート順序を指定してASC順でソートされたデータが返される', () => {
  it('sortBy=actualStartDateTime, sortOrder=ASC で昇順にソートされたデータが返される', async () => {
    // Setup: unsorted mock data (as retrieved from database - not pre-sorted)
    const unsortedMockWorkResults: GetWorkResultByIdOutput[] = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T09:30:00Z',
        actualEndDateTime: '2024-01-01T10:30:00Z',
        actualQuantity: 50,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Remarks 1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-001',
        workerId: 'worker-002',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T07:15:00Z',
        actualEndDateTime: '2024-01-01T08:15:00Z',
        actualQuantity: 45,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Remarks 2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-001',
        workerId: 'worker-003',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T09:00:00Z',
        actualQuantity: 55,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'Remarks 3',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
    ];

    // Execute: with sortBy and sortOrder specified
    const input: ListWorkResultsByConditionInput = {
      workResultIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workStatuses: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDefectCount: null,
      maxDefectCount: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    // Verify: results are sorted in ASC order by actualStartDateTime
    expect(result.workResults).toHaveLength(3);
    expect(result.workResults[0].actualStartDateTime).toBe('2024-01-01T07:15:00Z');
    expect(result.workResults[0].workResultId).toBe('wr-002');
    expect(result.workResults[1].actualStartDateTime).toBe('2024-01-01T08:00:00Z');
    expect(result.workResults[1].workResultId).toBe('wr-003');
    expect(result.workResults[2].actualStartDateTime).toBe('2024-01-01T09:30:00Z');
    expect(result.workResults[2].workResultId).toBe('wr-001');

    // Verify: output metadata
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});