import { listWorkersByCondition, ListWorkersByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-628: ListWorkersByCondition with identical min and max hourly rate', () => {
  it('should return only workers with hourly rate equal to the specified value when minHourlyRate and maxHourlyRate are the same', async () => {
    const input: ListWorkersByConditionInput = {
      minHourlyRate: 1500,
      maxHourlyRate: 1500,
    };

    const result = await listWorkersByCondition(input);

    expect(result.workers).toBeDefined();
    expect(result.workers.length).toBe(3);
    expect(result.totalCount).toBe(3);

    const hourlyRates = result.workers.map((worker) => worker.hourlyRate);
    expect(hourlyRates.every((rate) => rate === 1500)).toBe(true);

    const workerIds = result.workers.map((worker) => worker.workerId).sort();
    expect(workerIds).toEqual(['worker-001', 'worker-002', 'worker-003'].sort());

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAt = new Date(result.retrievedAt);
    expect(retrievedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(retrievedAt.getTime()).toBeGreaterThan(Date.now() - 60000);
  });
});