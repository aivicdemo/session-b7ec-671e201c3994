import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-861: 人員配置実行状況IDでソートして取得する', () => {
  it('sortBy=allocationExecutionStatusId、sortOrder=ASCで結果がソート順に並んでいること', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      delayFlagFilter: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minPlannedWorkHours: null,
      maxPlannedWorkHours: null,
      minActualWorkHours: null,
      maxActualWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: 'allocationExecutionStatusId',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    if (result.allocationExecutionStatuses.length > 1) {
      for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
        const current = result.allocationExecutionStatuses[i].allocationExecutionStatusId;
        const next = result.allocationExecutionStatuses[i + 1].allocationExecutionStatusId;
        expect(current <= next).toBe(true);
      }
    }
  });
});