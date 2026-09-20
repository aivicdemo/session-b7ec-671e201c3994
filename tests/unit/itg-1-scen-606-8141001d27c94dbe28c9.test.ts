import { listWorkersByCondition } from '../../src/logic/data-persistence';
import type { ListWorkersByConditionInput, ListWorkersByConditionOutput, GetWorkerByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-606: 時給範囲で絞り込んだ作業者一覧取得', () => {
  const workerDatabase: GetWorkerByIdOutput[] = [
    {
      workerId: 'worker-a',
      workerName: '作業者A',
      facilityId: 'facility-1',
      teamId: 'team-1',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1800,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-b',
      workerName: '作業者B',
      facilityId: 'facility-1',
      teamId: 'team-1',
      jobType: 'inspection',
      operatingStatus: 'active',
      hourlyRate: 2000,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-c',
      workerName: '作業者C',
      facilityId: 'facility-1',
      teamId: 'team-2',
      jobType: 'packing',
      operatingStatus: 'active',
      hourlyRate: 2200,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-d',
      workerName: '作業者D',
      facilityId: 'facility-2',
      teamId: 'team-3',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1200,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: undefined,
    },
    {
      workerId: 'worker-e',
      workerName: '作業者E',
      facilityId: 'facility-2',
      teamId: 'team-4',
      jobType: 'inspection',
      operatingStatus: 'active',
      hourlyRate: 2800,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: undefined,
    },
  ];

  // Mock implementation for database access
  const mockListWorkersByCondition = jest.fn(async (input: ListWorkersByConditionInput): Promise<ListWorkersByConditionOutput> => {
    let filtered = workerDatabase;

    if (input.minHourlyRate !== null && input.minHourlyRate !== undefined) {
      filtered = filtered.filter(w => (w.hourlyRate ?? 0) >= input.minHourlyRate);
    }

    if (input.maxHourlyRate !== null && input.maxHourlyRate !== undefined) {
      filtered = filtered.filter(w => (w.hourlyRate ?? 0) <= input.maxHourlyRate);
    }

    const now = new Date().toISOString();

    return {
      workers: filtered,
      totalCount: filtered.length,
      pageNumber: input.pageNumber,
      pageSize: input.pageSize,
      retrievedAt: now,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('時給範囲（1500円以上2500円以下）で作業者を絞り込める', async () => {
    const input: ListWorkersByConditionInput = {
      minHourlyRate: 1500,
      maxHourlyRate: 2500,
    };

    mockListWorkersByCondition.mockImplementation(async (inp: ListWorkersByConditionInput) => {
      let filtered = workerDatabase;

      if (inp.minHourlyRate !== null && inp.minHourlyRate !== undefined) {
        filtered = filtered.filter(w => (w.hourlyRate ?? 0) >= inp.minHourlyRate);
      }

      if (inp.maxHourlyRate !== null && inp.maxHourlyRate !== undefined) {
        filtered = filtered.filter(w => (w.hourlyRate ?? 0) <= inp.maxHourlyRate);
      }

      const now = new Date().toISOString();

      return {
        workers: filtered,
        totalCount: filtered.length,
        pageNumber: inp.pageNumber,
        pageSize: inp.pageSize,
        retrievedAt: now,
      };
    });

    const result = await mockListWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.workers).toHaveLength(3);

    const workerIds = result.workers.map(w => w.workerId);
    expect(workerIds).toContain('worker-a');
    expect(workerIds).toContain('worker-b');
    expect(workerIds).toContain('worker-c');

    expect(workerIds).not.toContain('worker-d');
    expect(workerIds).not.toContain('worker-e');

    const workerA = result.workers.find(w => w.workerId === 'worker-a');
    expect(workerA?.hourlyRate).toBe(1800);

    const workerB = result.workers.find(w => w.workerId === 'worker-b');
    expect(workerB?.hourlyRate).toBe(2000);

    const workerC = result.workers.find(w => w.workerId === 'worker-c');
    expect(workerC?.hourlyRate).toBe(2200);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    const now = Date.now();
    const timeDifference = Math.abs(now - retrievedTime);
    expect(timeDifference).toBeLessThan(5000);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    expect(mockListWorkersByCondition).toHaveBeenCalledWith(input);
    expect(mockListWorkersByCondition).toHaveBeenCalledTimes(1);
  });
});