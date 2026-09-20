import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-737: ページ番号とページサイズを指定して該当ページのデータが返される', () => {
  const createMockWorkResult = (index: number): GetWorkResultByIdOutput => ({
    workResultId: `work-result-${String(index + 1).padStart(3, '0')}`,
    workInstructionId: `work-instruction-${(index % 5) + 1}`,
    workerId: `worker-${(index % 10) + 1}`,
    facilityId: `facility-${(index % 3) + 1}`,
    teamId: `team-${(index % 4) + 1}`,
    actualStartDateTime: new Date(Date.now() - 86400000 * (35 - index)).toISOString(),
    actualEndDateTime: new Date(Date.now() - 86400000 * (34 - index)).toISOString(),
    actualQuantity: 100 + index,
    workStatus: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'in_progress' : 'suspended',
    defectCount: index % 10 === 0 ? 5 : undefined,
    remarks: `Work result ${index + 1}`,
    createdAt: new Date(Date.now() - 86400000 * (35 - index)).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * (34 - index)).toISOString(),
    createdBy: `user-${(index % 5) + 1}`,
    updatedBy: undefined,
  });

  let testDatabase: GetWorkResultByIdOutput[];

  beforeEach(() => {
    jest.clearAllMocks();
    testDatabase = Array.from({ length: 35 }, (_, index) => createMockWorkResult(index));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return paginated work results with correct page number and size', async () => {
    const input: ListWorkResultsByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
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
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listWorkResultsByCondition(input);

    // 基本的な出力フィールドの検証
    expect(result).toBeDefined();
    expect(result.workResults).toHaveLength(10);
    expect(result.totalCount).toBe(35);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // ページネーション計算の確認：ページ2、1ページあたり10件 → レコード21～30（配列インデックスは20～29）
    const expectedPageStartIndex = (2 - 1) * 10; // 10
    const expectedPageEndIndex = expectedPageStartIndex + 10; // 20
    const expectedPageData = testDatabase.slice(expectedPageStartIndex, expectedPageEndIndex);

    // 返却データが期待値と一致することを確認
    result.workResults.forEach((item, idx) => {
      const expectedItem = expectedPageData[idx];
      expect(item.workResultId).toBe(expectedItem.workResultId);
      expect(item.workInstructionId).toBe(expectedItem.workInstructionId);
      expect(item.workerId).toBe(expectedItem.workerId);
      expect(item.facilityId).toBe(expectedItem.facilityId);
      expect(item.teamId).toBe(expectedItem.teamId);
      expect(item.actualStartDateTime).toBe(expectedItem.actualStartDateTime);
      expect(item.actualEndDateTime).toBe(expectedItem.actualEndDateTime);
      expect(item.actualQuantity).toBe(expectedItem.actualQuantity);
      expect(item.workStatus).toBe(expectedItem.workStatus);
      expect(item.createdAt).toBe(expectedItem.createdAt);
      expect(item.updatedAt).toBe(expectedItem.updatedAt);
      expect(item.createdBy).toBe(expectedItem.createdBy);
    });

    // すべての要素が GetWorkResultByIdOutput 型であることを確認
    result.workResults.forEach((item) => {
      expect(item).toHaveProperty('workResultId');
      expect(item).toHaveProperty('workInstructionId');
      expect(item).toHaveProperty('workerId');
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('actualStartDateTime');
      expect(item).toHaveProperty('actualEndDateTime');
      expect(item).toHaveProperty('actualQuantity');
      expect(item).toHaveProperty('workStatus');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('createdBy');
      expect(typeof item.workResultId).toBe('string');
      expect(typeof item.workInstructionId).toBe('string');
      expect(typeof item.workerId).toBe('string');
      expect(typeof item.facilityId).toBe('string');
      expect(typeof item.teamId).toBe('string');
      expect(typeof item.actualQuantity).toBe('number');
      expect(typeof item.workStatus).toBe('string');
    });
  });
});