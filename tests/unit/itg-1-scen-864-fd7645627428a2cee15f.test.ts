import { listAllocationExecutionStatusByCondition, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('listAllocationExecutionStatusByCondition - SCEN-864: ページング指定ありで最後のページを取得する', () => {
  it('ページング指定（pageNumber: 3, pageSize: 10）で最後のページを正常に取得する', async () => {
    const input = {
      pageNumber: 3,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.allocationExecutionStatuses.length).toBe(8);

    expect(result.totalCount).toBe(28);
    expect(result.pageNumber).toBe(3);
    expect(result.pageSize).toBe(10);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    result.allocationExecutionStatuses.forEach((item) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(typeof item.allocationExecutionStatusId).toBe('string');
      
      expect(item.allocationPlanId).toBeDefined();
      expect(typeof item.allocationPlanId).toBe('string');
      
      expect(item.workInstructionId).toBeDefined();
      expect(typeof item.workInstructionId).toBe('string');
      
      expect(item.workerId).toBeDefined();
      expect(typeof item.workerId).toBe('string');
      
      expect(item.facilityId).toBeDefined();
      expect(typeof item.facilityId).toBe('string');
      
      expect(item.teamId).toBeDefined();
      expect(typeof item.teamId).toBe('string');
      
      expect(item.allocationState).toBeDefined();
      expect(typeof item.allocationState).toBe('string');
      
      expect(item.plannedStartDateTime).toBeDefined();
      expect(typeof item.plannedStartDateTime).toBe('string');
      
      expect(item.plannedEndDateTime).toBeDefined();
      expect(typeof item.plannedEndDateTime).toBe('string');
      
      expect(item.plannedWorkHours).toBeDefined();
      expect(typeof item.plannedWorkHours).toBe('number');
      expect(item.plannedWorkHours).toBeGreaterThan(0);
      
      expect(item.progressRate).toBeDefined();
      expect(typeof item.progressRate).toBe('number');
      expect(item.progressRate).toBeGreaterThanOrEqual(0);
      expect(item.progressRate).toBeLessThanOrEqual(100);
      
      expect(item.delayFlag).toBeDefined();
      expect(typeof item.delayFlag).toBe('boolean');
      
      expect(item.createdAt).toBeDefined();
      expect(typeof item.createdAt).toBe('string');
      
      expect(item.updatedAt).toBeDefined();
      expect(typeof item.updatedAt).toBe('string');
      
      expect(item.createdBy).toBeDefined();
      expect(typeof item.createdBy).toBe('string');
    });
  });
});