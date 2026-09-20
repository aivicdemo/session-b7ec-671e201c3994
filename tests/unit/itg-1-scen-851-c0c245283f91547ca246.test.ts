import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import type { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-851: 計画工数の範囲で絞り込んで取得する', () => {
  it('指定された計画工数範囲内のデータのみを返却する', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      minPlannedWorkHours: 10,
      maxPlannedWorkHours: 50,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.plannedWorkHours).toBeGreaterThanOrEqual(10);
      expect(status.plannedWorkHours).toBeLessThanOrEqual(50);
    });

    expect(result.totalCount).toBe(result.allocationExecutionStatuses.length);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('計画工数の範囲で絞り込みがない場合、全件返却する', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {};

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('最小計画工数のみ指定した場合、その値以上のデータを返却する', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      minPlannedWorkHours: 20,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.plannedWorkHours).toBeGreaterThanOrEqual(20);
    });

    expect(result.totalCount).toBe(result.allocationExecutionStatuses.length);
  });

  it('最大計画工数のみ指定した場合、その値以下のデータを返却する', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      maxPlannedWorkHours: 40,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.plannedWorkHours).toBeLessThanOrEqual(40);
    });

    expect(result.totalCount).toBe(result.allocationExecutionStatuses.length);
  });

  it('retrievedAtがISO8601形式の日時を示すこと', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      minPlannedWorkHours: 10,
      maxPlannedWorkHours: 50,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('返却データが期待される構造を持つこと', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      minPlannedWorkHours: 10,
      maxPlannedWorkHours: 50,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toHaveProperty('allocationExecutionStatuses');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');

    if (result.allocationExecutionStatuses.length > 0) {
      const firstStatus = result.allocationExecutionStatuses[0];
      expect(firstStatus).toHaveProperty('allocationExecutionStatusId');
      expect(firstStatus).toHaveProperty('allocationPlanId');
      expect(firstStatus).toHaveProperty('workInstructionId');
      expect(firstStatus).toHaveProperty('workerId');
      expect(firstStatus).toHaveProperty('facilityId');
      expect(firstStatus).toHaveProperty('teamId');
      expect(firstStatus).toHaveProperty('allocationState');
      expect(firstStatus).toHaveProperty('plannedStartDateTime');
      expect(firstStatus).toHaveProperty('plannedEndDateTime');
      expect(firstStatus).toHaveProperty('plannedWorkHours');
      expect(firstStatus).toHaveProperty('progressRate');
      expect(firstStatus).toHaveProperty('delayFlag');
      expect(typeof firstStatus.plannedWorkHours).toBe('number');
      expect(typeof firstStatus.progressRate).toBe('number');
      expect(typeof firstStatus.delayFlag).toBe('boolean');
    }
  });
});