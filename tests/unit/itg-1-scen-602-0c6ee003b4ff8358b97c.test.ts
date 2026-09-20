import { listWorkersByCondition } from '../../src/logic/data-persistence';
import { ListWorkersByConditionInput, ListWorkersByConditionOutput, GetWorkerByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-602: チームID配列で絞り込んだ作業者一覧が正常に返される', () => {
  let testWorkers: GetWorkerByIdOutput[];

  beforeEach(() => {
    testWorkers = [
      {
        workerId: 'W001',
        workerName: '作業者A',
        facilityId: 'F001',
        teamId: 'T001',
        jobType: '組立',
        operatingStatus: 'active',
        hourlyRate: 1500,
        maxWorkingHours: 8,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'USER001',
        updatedBy: 'USER002',
      },
      {
        workerId: 'W002',
        workerName: '作業者B',
        facilityId: 'F001',
        teamId: 'T001',
        jobType: '検査',
        operatingStatus: 'active',
        hourlyRate: 1600,
        maxWorkingHours: 8,
        createdAt: '2024-01-02T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'USER001',
        updatedBy: 'USER002',
      },
      {
        workerId: 'W003',
        workerName: '作業者C',
        facilityId: 'F002',
        teamId: 'T002',
        jobType: '梱包',
        operatingStatus: 'active',
        hourlyRate: 1400,
        maxWorkingHours: 8,
        createdAt: '2024-01-03T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'USER001',
        updatedBy: 'USER002',
      },
      {
        workerId: 'W004',
        workerName: '作業者D',
        facilityId: 'F001',
        teamId: 'T001',
        jobType: '組立',
        operatingStatus: 'inactive',
        hourlyRate: 1500,
        maxWorkingHours: 8,
        createdAt: '2024-01-04T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'USER001',
        updatedBy: 'USER002',
      },
    ];
  });

  test('teamIds配列に[\\"T001\\"]を指定して呼び出すと、T001に所属する作業者3件が返される', async () => {
    const input: ListWorkersByConditionInput = {
      teamIds: ['T001'],
      workerIds: undefined,
      facilityIds: undefined,
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.workers.length).toBe(3);

    const matchingWorkers = testWorkers.filter(w => w.teamId === 'T001');
    result.workers.forEach(resultWorker => {
      expect(matchingWorkers.some(w => w.workerId === resultWorker.workerId)).toBe(true);
    });

    testWorkers
      .filter(w => w.teamId !== 'T001')
      .forEach(nonMatchingWorker => {
        expect(result.workers.some(w => w.workerId === nonMatchingWorker.workerId)).toBe(false);
      });

    expect(result.totalCount).toBe(3);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoRegex.test(result.retrievedAt)).toBe(true);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
  });

  test('返される作業者は全てGetWorkerByIdOutput型の正しいフィールドを持つ', async () => {
    const input: ListWorkersByConditionInput = {
      teamIds: ['T001'],
    };

    const result = await listWorkersByCondition(input);

    expect(result.workers).toBeDefined();
    result.workers.forEach(worker => {
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
  });

  test('返された全作業者のteamIdがT001であること', async () => {
    const input: ListWorkersByConditionInput = {
      teamIds: ['T001'],
    };

    const result = await listWorkersByCondition(input);

    expect(result.workers.length).toBeGreaterThan(0);
    result.workers.forEach(worker => {
      expect(worker.teamId).toBe('T001');
    });
  });
});