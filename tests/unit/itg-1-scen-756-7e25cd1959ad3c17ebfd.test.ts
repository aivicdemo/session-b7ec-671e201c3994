import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-756: 検索条件がすべてnull・undefinedの場合、条件無しで全件取得される', () => {
  it('should retrieve all work results when all search conditions are null or undefined', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBeGreaterThanOrEqual(0);

    if (result.workResults.length > 0) {
      result.workResults.forEach((workResult: GetWorkResultByIdOutput) => {
        expect(workResult.workResultId).toBeDefined();
        expect(typeof workResult.workResultId).toBe('string');
        expect(workResult.workInstructionId).toBeDefined();
        expect(workResult.workerId).toBeDefined();
        expect(workResult.facilityId).toBeDefined();
        expect(workResult.teamId).toBeDefined();
        expect(workResult.actualStartDateTime).toBeDefined();
        expect(workResult.actualEndDateTime).toBeDefined();
        expect(workResult.actualQuantity).toBeDefined();
        expect(typeof workResult.actualQuantity).toBe('number');
        expect(workResult.workStatus).toBeDefined();
        expect(workResult.createdAt).toBeDefined();
        expect(workResult.updatedAt).toBeDefined();
      });
    }

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.workResults.length);

    expect(result.pageNumber).toBe(1);

    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('should return paginated results with default pagination when no page parameters are specified', async () => {
    const input: ListWorkResultsByConditionInput = {
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.workResults.length).toBeLessThanOrEqual(50);
  });

  it('should include totalCount reflecting all matching records regardless of pagination', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    if (result.totalCount > 50) {
      expect(result.workResults.length).toBe(50);
    } else {
      expect(result.workResults.length).toBe(result.totalCount);
    }
  });

  it('should return valid ISO 8601 timestamp in retrievedAt field', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    const timestamp = new Date(result.retrievedAt);
    expect(isNaN(timestamp.getTime())).toBe(false);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should not throw errors when all search conditions are null or undefined', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    let errorThrown = false;
    try {
      await listWorkResultsByCondition(input);
    } catch (error) {
      errorThrown = true;
    }

    expect(errorThrown).toBe(false);
  });
});