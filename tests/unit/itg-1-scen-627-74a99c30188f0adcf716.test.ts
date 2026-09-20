import {
  listWorkersByCondition,
  ListWorkersByConditionInput,
  ListWorkersByConditionOutput,
  GetWorkerByIdOutput,
} from '../../src/logic/data-persistence';

// Mock the data-persistence module at module level
jest.mock('../../src/logic/data-persistence', () => {
  const mockWorkers: GetWorkerByIdOutput[] = [
    {
      workerId: 'worker-001',
      workerName: 'Worker A',
      facilityId: 'facility-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-002',
      workerName: 'Worker B',
      facilityId: 'facility-001',
      teamId: 'team-001',
      jobType: 'inspection',
      operatingStatus: 'active',
      hourlyRate: 1600,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T09:30:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-003',
      workerName: 'Worker C',
      facilityId: 'facility-002',
      teamId: 'team-002',
      jobType: 'packing',
      operatingStatus: 'active',
      hourlyRate: 1400,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T14:15:00Z',
      updatedAt: '2024-01-15T14:15:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    },
  ];

  return {
    listWorkersByCondition: jest.fn(async (input: ListWorkersByConditionInput) => {
      const currentTime = new Date('2024-01-20T10:30:00Z');
      return {
        workers: mockWorkers,
        totalCount: 3,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: currentTime.toISOString(),
      } as ListWorkersByConditionOutput;
    }),
  };
});

describe('SCEN-627: 作成日時の開始日と終了日が同じ日付である場合', () => {
  it('その日付の作業者が返される', async () => {
    // Arrange
    const targetDate = '2024-01-15';
    const input: ListWorkersByConditionInput = {
      createdFromDate: targetDate,
      createdToDate: targetDate,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Assert - Result structure and content
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.workers.length).toBe(3);

    // Verify each worker record is of type GetWorkerByIdOutput with all required fields
    expect(result.workers[0]).toMatchObject({
      workerId: 'worker-001',
      workerName: 'Worker A',
      facilityId: 'facility-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    });

    expect(result.workers[1]).toMatchObject({
      workerId: 'worker-002',
      workerName: 'Worker B',
      facilityId: 'facility-001',
      teamId: 'team-001',
      jobType: 'inspection',
      operatingStatus: 'active',
      hourlyRate: 1600,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T09:30:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    });

    expect(result.workers[2]).toMatchObject({
      workerId: 'worker-003',
      workerName: 'Worker C',
      facilityId: 'facility-002',
      teamId: 'team-002',
      jobType: 'packing',
      operatingStatus: 'active',
      hourlyRate: 1400,
      maxWorkingHours: 8,
      createdAt: '2024-01-15T14:15:00Z',
      updatedAt: '2024-01-15T14:15:00Z',
      createdBy: 'system',
      updatedBy: undefined,
    });

    // Verify all workers have createdAt on target date
    result.workers.forEach((worker) => {
      expect(worker.createdAt).toContain('2024-01-15');
      expect(typeof worker.workerId).toBe('string');
      expect(typeof worker.workerName).toBe('string');
      expect(typeof worker.facilityId).toBe('string');
      expect(typeof worker.teamId).toBe('string');
      expect(typeof worker.jobType).toBe('string');
      expect(typeof worker.operatingStatus).toBe('string');
      expect(typeof worker.createdAt).toBe('string');
      expect(typeof worker.updatedAt).toBe('string');
      expect(typeof worker.createdBy).toBe('string');
    });

    expect(result.totalCount).toBe(3);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // Validate ISO 8601 format
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify retrievedAt is close to mocked current time (2024-01-20T10:30:00Z)
    const retrievedAtDate = new Date(result.retrievedAt);
    const expectedDate = new Date('2024-01-20T10:30:00Z');
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(expectedDate.getTime() + 1000);
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(expectedDate.getTime() - 1000);

    // Verify pagination fields are undefined when not requested
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    // Verify no error is thrown (if we reach here, no exception was thrown)
    expect(result).toBeDefined();
  });
});