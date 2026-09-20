import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-725: 拠点IDで検索して合致するデータが返される', () => {
  let testData: GetWorkResultByIdOutput[];

  beforeAll(() => {
    // テストデータ準備: 複数の拠点IDを持つ作業実績データ
    testData = [
      // F001に属するレコード5件
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'F001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: 2,
        remarks: 'test data 1',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'F001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T13:00:00Z',
        actualEndDateTime: '2024-01-15T16:00:00Z',
        actualQuantity: 120,
        workStatus: '完了',
        defectCount: 0,
        remarks: 'test data 2',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T17:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'F001',
        teamId: 'team-002',
        actualStartDateTime: '2024-01-16T09:00:00Z',
        actualEndDateTime: '2024-01-16T11:00:00Z',
        actualQuantity: 80,
        workStatus: '完了',
        defectCount: 1,
        remarks: 'test data 3',
        createdAt: '2024-01-16T08:00:00Z',
        updatedAt: '2024-01-16T12:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-004',
        facilityId: 'F001',
        teamId: 'team-002',
        actualStartDateTime: '2024-01-16T13:00:00Z',
        actualEndDateTime: '2024-01-16T15:00:00Z',
        actualQuantity: 110,
        workStatus: '進行中',
        defectCount: undefined,
        remarks: 'test data 4',
        createdAt: '2024-01-16T12:00:00Z',
        updatedAt: '2024-01-16T15:30:00Z',
        createdBy: 'user-002',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-005',
        workInstructionId: 'wi-005',
        workerId: 'worker-005',
        facilityId: 'F001',
        teamId: 'team-003',
        actualStartDateTime: '2024-01-17T09:00:00Z',
        actualEndDateTime: '2024-01-17T14:00:00Z',
        actualQuantity: 150,
        workStatus: '完了',
        defectCount: 3,
        remarks: 'test data 5',
        createdAt: '2024-01-17T08:00:00Z',
        updatedAt: '2024-01-17T15:00:00Z',
        createdBy: 'user-003',
        updatedBy: 'user-001',
      },
      // F002に属するレコード3件
      {
        workResultId: 'wr-006',
        workInstructionId: 'wi-006',
        workerId: 'worker-006',
        facilityId: 'F002',
        teamId: 'team-004',
        actualStartDateTime: '2024-01-15T10:00:00Z',
        actualEndDateTime: '2024-01-15T13:00:00Z',
        actualQuantity: 95,
        workStatus: '完了',
        defectCount: 1,
        remarks: 'F002 test data 1',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T14:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-007',
        workInstructionId: 'wi-007',
        workerId: 'worker-007',
        facilityId: 'F002',
        teamId: 'team-004',
        actualStartDateTime: '2024-01-16T10:00:00Z',
        actualEndDateTime: '2024-01-16T12:00:00Z',
        actualQuantity: 75,
        workStatus: '完了',
        defectCount: 0,
        remarks: 'F002 test data 2',
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-16T13:00:00Z',
        createdBy: 'user-002',
        updatedBy: 'user-001',
      },
      {
        workResultId: 'wr-008',
        workInstructionId: 'wi-008',
        workerId: 'worker-008',
        facilityId: 'F002',
        teamId: 'team-005',
        actualStartDateTime: '2024-01-17T10:00:00Z',
        actualEndDateTime: '2024-01-17T13:00:00Z',
        actualQuantity: 105,
        workStatus: '進行中',
        defectCount: undefined,
        remarks: 'F002 test data 3',
        createdAt: '2024-01-17T09:00:00Z',
        updatedAt: '2024-01-17T13:30:00Z',
        createdBy: 'user-003',
        updatedBy: undefined,
      },
      // F003に属するレコード2件
      {
        workResultId: 'wr-009',
        workInstructionId: 'wi-009',
        workerId: 'worker-009',
        facilityId: 'F003',
        teamId: 'team-006',
        actualStartDateTime: '2024-01-15T14:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 88,
        workStatus: '完了',
        defectCount: 2,
        remarks: 'F003 test data 1',
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'wr-010',
        workInstructionId: 'wi-010',
        workerId: 'worker-010',
        facilityId: 'F003',
        teamId: 'team-006',
        actualStartDateTime: '2024-01-16T14:00:00Z',
        actualEndDateTime: '2024-01-16T17:00:00Z',
        actualQuantity: 92,
        workStatus: '完了',
        defectCount: 1,
        remarks: 'F003 test data 2',
        createdAt: '2024-01-16T13:00:00Z',
        updatedAt: '2024-01-16T18:00:00Z',
        createdBy: 'user-002',
        updatedBy: undefined,
      },
    ];
  });

  it('facilityIds=[\'F001\']の条件で検索した場合、F001に属するレコード5件が返される', async () => {
    const input: ListWorkResultsByConditionInput = {
      facilityIds: ['F001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
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

    const result = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBe(5);
    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();

    result.workResults.forEach((item) => {
      expect(item.facilityId).toBe('F001');
      expect(item.workResultId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(item.actualStartDateTime).toBeDefined();
      expect(item.actualEndDateTime).toBeDefined();
      expect(item.actualQuantity).toBeDefined();
      expect(typeof item.actualQuantity).toBe('number');
      expect(item.workStatus).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
      expect(item.createdBy).toBeDefined();
    });

    const facilityIds = result.workResults.map((r) => r.facilityId);
    expect(facilityIds.every((id) => id === 'F001')).toBe(true);
  });

  it('searchConditionにfacilityIds=[\'F001\']のみを指定した場合、デフォルトのpageNumberとpageSizeが設定される', async () => {
    const input: ListWorkResultsByConditionInput = {
      facilityIds: ['F001'],
      workResultIds: null,
      workInstructionIds: null,
      workerIds: null,
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  it('workResultsの各要素がGetWorkResultByIdOutput型の構造を満たしている', async () => {
    const input: ListWorkResultsByConditionInput = {
      facilityIds: ['F001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
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

    const result = await listWorkResultsByCondition(input);

    result.workResults.forEach((workResult: GetWorkResultByIdOutput) => {
      expect(workResult.workResultId).toBeDefined();
      expect(typeof workResult.workResultId).toBe('string');

      expect(workResult.workInstructionId).toBeDefined();
      expect(typeof workResult.workInstructionId).toBe('string');

      expect(workResult.workerId).toBeDefined();
      expect(typeof workResult.workerId).toBe('string');

      expect(workResult.facilityId).toBeDefined();
      expect(typeof workResult.facilityId).toBe('string');

      expect(workResult.teamId).toBeDefined();
      expect(typeof workResult.teamId).toBe('string');

      expect(workResult.actualStartDateTime).toBeDefined();
      expect(typeof workResult.actualStartDateTime).toBe('string');

      expect(workResult.actualEndDateTime).toBeDefined();
      expect(typeof workResult.actualEndDateTime).toBe('string');

      expect(workResult.actualQuantity).toBeDefined();
      expect(typeof workResult.actualQuantity).toBe('number');
      expect(workResult.actualQuantity).toBeGreaterThanOrEqual(0);

      expect(workResult.workStatus).toBeDefined();
      expect(typeof workResult.workStatus).toBe('string');

      expect(workResult.createdAt).toBeDefined();
      expect(typeof workResult.createdAt).toBe('string');

      expect(workResult.updatedAt).toBeDefined();
      expect(typeof workResult.updatedAt).toBe('string');

      expect(workResult.createdBy).toBeDefined();
      expect(typeof workResult.createdBy).toBe('string');
    });
  });

  it('複数の同時検索条件がすべてnull/undefinedの場合、facilityIds条件のみが有効に機能する', async () => {
    const input: ListWorkResultsByConditionInput = {
      facilityIds: ['F001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
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

    const result = await listWorkResultsByCondition(input);

    expect(result.totalCount).toBe(5);
    expect(result.workResults.length).toBe(5);
    result.workResults.forEach((item) => {
      expect(item.facilityId).toBe('F001');
    });
  });

  it('retrievedAtフィールドが現在のISO 8601形式日時を含む', async () => {
    const beforeCall = new Date();
    const input: ListWorkResultsByConditionInput = {
      facilityIds: ['F001'],
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
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

    const result = await listWorkResultsByCondition(input);
    const afterCall = new Date();

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});