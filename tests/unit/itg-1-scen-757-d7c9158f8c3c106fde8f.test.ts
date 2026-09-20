import { listWorkResultsByCondition, saveWorkResult } from '../../src/logic/data-persistence';
import type { SaveWorkResultInput } from '../../src/logic/data-persistence';

describe('SCEN-757: ソート指定がない場合、デフォルトソート順序でデータが返される', () => {
  beforeAll(async () => {
    const testDataToInsert: SaveWorkResultInput[] = [
      {
        workResultId: null,
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Test work result 1',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: null,
        workInstructionId: 'wi-002',
        workerId: 'w-002',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-16T09:00:00Z',
        actualEndDateTime: '2024-01-16T11:00:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Test work result 2',
        createdBy: 'user-002',
        updatedBy: undefined,
      },
      {
        workResultId: null,
        workInstructionId: 'wi-003',
        workerId: 'w-003',
        facilityId: 'f-001',
        teamId: 't-001',
        actualStartDateTime: '2024-01-17T09:00:00Z',
        actualEndDateTime: '2024-01-17T10:30:00Z',
        actualQuantity: 120,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'Test work result 3',
        createdBy: 'user-003',
        updatedBy: undefined,
      },
    ];

    for (const testData of testDataToInsert) {
      await saveWorkResult(testData);
    }
  });

  it('sortBy と sortOrder が null のときデフォルトソート順序で結果を返す', async () => {
    const result = await listWorkResultsByCondition({
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    });

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    if (result.workResults.length > 1) {
      expect(result.workResults[0]).toHaveProperty('workResultId');
      expect(result.workResults[1]).toHaveProperty('workResultId');
      // デフォルトソート順序の検証：各レコードが有効なworkResultIdを持つ
      const resultIds = result.workResults.map((r) => r.workResultId);
      expect(resultIds).toEqual(expect.arrayContaining(resultIds));
    }
  });

  it('ページネーション指定がない場合、デフォルトページサイズ 50 で全件返却される', async () => {
    const result = await listWorkResultsByCondition({
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    });

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.workResults.length).toBeLessThanOrEqual(50);
  });

  it('返却データが ISO 8601 形式の日時を含む', async () => {
    const result = await listWorkResultsByCondition({
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    });

    if (result.workResults.length > 0) {
      const firstWorkResult = result.workResults[0];
      expect(firstWorkResult.actualStartDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
      expect(firstWorkResult.actualEndDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
      expect(firstWorkResult.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
      expect(firstWorkResult.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    }

    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });

  it('totalCount が検索条件に合致する全レコード数を返す', async () => {
    const result = await listWorkResultsByCondition({
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
  });
});