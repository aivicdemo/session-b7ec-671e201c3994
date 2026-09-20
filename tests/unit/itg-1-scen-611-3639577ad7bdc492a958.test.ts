import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-611: sortByと sortOrderを指定してソートされた作業者一覧が正常に返される', () => {
  it('should return worker list sorted by workerName in ascending order', async () => {
    const input = {
      sortBy: 'workerName',
      sortOrder: 'ASC',
    };

    const result = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    if (result.workers.length > 1) {
      for (let i = 0; i < result.workers.length - 1; i++) {
        const currentWorkerName = result.workers[i].workerName;
        const nextWorkerName = result.workers[i + 1].workerName;
        expect(currentWorkerName.localeCompare(nextWorkerName)).toBeLessThanOrEqual(0);
      }
    }

    result.workers.forEach((worker) => {
      expect(worker.workerId).toBeDefined();
      expect(typeof worker.workerId).toBe('string');
      expect(worker.workerName).toBeDefined();
      expect(typeof worker.workerName).toBe('string');
      expect(worker.facilityId).toBeDefined();
      expect(typeof worker.facilityId).toBe('string');
      expect(worker.teamId).toBeDefined();
      expect(typeof worker.teamId).toBe('string');
      expect(worker.jobType).toBeDefined();
      expect(typeof worker.jobType).toBe('string');
      expect(worker.operatingStatus).toBeDefined();
      expect(typeof worker.operatingStatus).toBe('string');
      expect(worker.createdAt).toBeDefined();
      expect(typeof worker.createdAt).toBe('string');
      expect(worker.updatedAt).toBeDefined();
      expect(typeof worker.updatedAt).toBe('string');
      expect(worker.createdBy).toBeDefined();
      expect(typeof worker.createdBy).toBe('string');
    });

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);
  });
});