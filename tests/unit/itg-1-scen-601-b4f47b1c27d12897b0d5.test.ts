import { listWorkersByCondition } from '../../src/logic/data-persistence';
import { ListWorkersByConditionInput, ListWorkersByConditionOutput, GetWorkerByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-601: 拠点ID配列で絞り込んだ作業者一覧が正常に返される', () => {
  it('should return workers filtered by facilityIds array', async () => {
    const input: ListWorkersByConditionInput = {
      facilityIds: ['FAC001', 'FAC002'],
      workerIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Verify workers array contains only workers from specified facilities
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);

    result.workers.forEach((worker: GetWorkerByIdOutput) => {
      expect(input.facilityIds).toContain(worker.facilityId);
    });

    // Verify totalCount matches the number of workers in the result
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    if (result.pageNumber === 1 && result.pageSize === 50) {
      expect(result.workers.length).toBeLessThanOrEqual(result.totalCount);
    }

    // Verify pagination parameters
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // Verify retrievedAt is in ISO 8601 format
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify all workers have required GetWorkerByIdOutput fields
    result.workers.forEach((worker: GetWorkerByIdOutput) => {
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
      expect(worker.updatedAt).toBeDefined();
      expect(worker.createdBy).toBeDefined();
    });
  });
});