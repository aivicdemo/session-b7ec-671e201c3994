import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-860: 遅延フラグでソートして取得する', () => {
  it('遅延フラグで降順ソートされたデータを取得できること', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      sortBy: 'delayFlag',
      sortOrder: 'desc',
    };

    const output: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(output).toBeDefined();
    expect(Array.isArray(output.allocationExecutionStatuses)).toBe(true);
    expect(typeof output.totalCount).toBe('number');
    expect(typeof output.retrievedAt).toBe('string');

    const retrievedAt = new Date(output.retrievedAt);
    expect(retrievedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(retrievedAt.toISOString()).toBe(output.retrievedAt);

    if (output.allocationExecutionStatuses.length > 0) {
      for (let i = 0; i < output.allocationExecutionStatuses.length - 1; i++) {
        const current = output.allocationExecutionStatuses[i].delayFlag;
        const next = output.allocationExecutionStatuses[i + 1].delayFlag;

        expect(current === true || next === false).toBe(true);
      }

      const delayedRecords = output.allocationExecutionStatuses.filter(
        (record) => record.delayFlag === true
      );
      const nonDelayedRecords = output.allocationExecutionStatuses.filter(
        (record) => record.delayFlag === false
      );

      if (delayedRecords.length > 0 && nonDelayedRecords.length > 0) {
        const lastDelayedIndex = output.allocationExecutionStatuses.findIndex(
          (record, index) =>
            record.delayFlag === true &&
            (index === output.allocationExecutionStatuses.length - 1 ||
              output.allocationExecutionStatuses[index + 1].delayFlag === false)
        );
        const firstNonDelayedIndex = output.allocationExecutionStatuses.findIndex(
          (record) => record.delayFlag === false
        );

        expect(lastDelayedIndex).toBeLessThan(firstNonDelayedIndex);
      }
    }

    expect(output.totalCount).toBeGreaterThanOrEqual(output.allocationExecutionStatuses.length);
  });

  it('ソート指定がない場合でもデータを取得できること', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {};

    const output: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(output).toBeDefined();
    expect(Array.isArray(output.allocationExecutionStatuses)).toBe(true);
    expect(typeof output.totalCount).toBe('number');
    expect(typeof output.retrievedAt).toBe('string');
  });

  it('出力オブジェクト内の各要素が期待される構造を持つこと', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      sortBy: 'delayFlag',
      sortOrder: 'desc',
      pageSize: 5,
    };

    const output: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    if (output.allocationExecutionStatuses.length > 0) {
      const record = output.allocationExecutionStatuses[0];

      expect(record.allocationExecutionStatusId).toBeDefined();
      expect(typeof record.allocationExecutionStatusId).toBe('string');

      expect(record.allocationPlanId).toBeDefined();
      expect(typeof record.allocationPlanId).toBe('string');

      expect(record.workInstructionId).toBeDefined();
      expect(typeof record.workInstructionId).toBe('string');

      expect(record.workerId).toBeDefined();
      expect(typeof record.workerId).toBe('string');

      expect(record.facilityId).toBeDefined();
      expect(typeof record.facilityId).toBe('string');

      expect(record.teamId).toBeDefined();
      expect(typeof record.teamId).toBe('string');

      expect(record.allocationState).toBeDefined();
      expect(typeof record.allocationState).toBe('string');

      expect(record.plannedStartDateTime).toBeDefined();
      expect(typeof record.plannedStartDateTime).toBe('string');

      expect(record.plannedEndDateTime).toBeDefined();
      expect(typeof record.plannedEndDateTime).toBe('string');

      expect(record.plannedWorkHours).toBeDefined();
      expect(typeof record.plannedWorkHours).toBe('number');

      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');

      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');

      expect(record.createdAt).toBeDefined();
      expect(typeof record.createdAt).toBe('string');

      expect(record.updatedAt).toBeDefined();
      expect(typeof record.updatedAt).toBe('string');

      expect(record.createdBy).toBeDefined();
      expect(typeof record.createdBy).toBe('string');
    }
  });

  it('ページネーション指定がある場合に適切に機能すること', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      sortBy: 'delayFlag',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 10,
    };

    const output: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(output.pageNumber).toEqual(1);
    expect(output.pageSize).toEqual(10);
    expect(output.allocationExecutionStatuses.length).toBeLessThanOrEqual(10);
  });
});