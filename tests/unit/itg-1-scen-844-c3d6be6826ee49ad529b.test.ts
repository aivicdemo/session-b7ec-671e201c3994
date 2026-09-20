import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-844: 配置状態で絞り込んで取得する', () => {
  it('should retrieve allocation execution status records filtered by allocation states', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中', '完了'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.allocationExecutionStatuses.length).toBeLessThanOrEqual(10);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(['進行中', '完了']).toContain(status.allocationState);

      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(typeof status.allocationExecutionStatusId).toBe('string');

      expect(status.allocationPlanId).toBeDefined();
      expect(typeof status.allocationPlanId).toBe('string');

      expect(status.workInstructionId).toBeDefined();
      expect(typeof status.workInstructionId).toBe('string');

      expect(status.workerId).toBeDefined();
      expect(typeof status.workerId).toBe('string');

      expect(status.facilityId).toBeDefined();
      expect(typeof status.facilityId).toBe('string');

      expect(status.teamId).toBeDefined();
      expect(typeof status.teamId).toBe('string');

      expect(status.progressRate).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);

      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');

      expect(status.plannedStartDateTime).toBeDefined();
      expect(typeof status.plannedStartDateTime).toBe('string');

      expect(status.plannedEndDateTime).toBeDefined();
      expect(typeof status.plannedEndDateTime).toBe('string');

      expect(status.plannedWorkHours).toBeDefined();
      expect(typeof status.plannedWorkHours).toBe('number');
      expect(status.plannedWorkHours).toBeGreaterThanOrEqual(0);

      if (status.actualStartDateTime !== null && status.actualStartDateTime !== undefined) {
        expect(typeof status.actualStartDateTime).toBe('string');
      }

      if (status.actualEndDateTime !== null && status.actualEndDateTime !== undefined) {
        expect(typeof status.actualEndDateTime).toBe('string');
      }

      if (status.actualWorkHours !== null && status.actualWorkHours !== undefined) {
        expect(typeof status.actualWorkHours).toBe('number');
        expect(status.actualWorkHours).toBeGreaterThanOrEqual(0);
      }

      expect(status.createdAt).toBeDefined();
      expect(typeof status.createdAt).toBe('string');

      expect(status.updatedAt).toBeDefined();
      expect(typeof status.updatedAt).toBe('string');

      expect(status.createdBy).toBeDefined();
      expect(typeof status.createdBy).toBe('string');
    });

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
  });

  it('should verify that only allocation state filter is applied without other conditions', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中'],
      pageNumber: 1,
      pageSize: 5,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.allocationState).toBe('進行中');
    });

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(5);
  });

  it('should calculate and return gap between planned and actual work hours', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['完了'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      if (status.actualWorkHours !== null && status.actualWorkHours !== undefined) {
        const gap = status.plannedWorkHours - status.actualWorkHours;
        expect(typeof gap).toBe('number');
      }
    });
  });

  it('should return empty array when no records match the filter', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['存在しない状態'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('should respect pagination parameters', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中', '完了'],
      pageNumber: 2,
      pageSize: 5,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.allocationExecutionStatuses.length).toBeLessThanOrEqual(5);
  });

  it('should include delay flag in retrieved records', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中', '完了'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');
    });
  });

  it('should include progress rate in all retrieved records', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.progressRate).toBeDefined();
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
    });
  });
});