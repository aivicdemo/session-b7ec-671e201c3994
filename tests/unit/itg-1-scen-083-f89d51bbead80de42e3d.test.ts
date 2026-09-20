import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-083: ProficiencyLevelDeterminationError when proficiency data is incomplete or contradictory', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetLatestProficiencyByWorkerAndJobType: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn();
    mockGetWorkerById = jest.fn();
    mockGetLatestProductivityDataByWorker = jest.fn();
    mockGetLatestProficiencyByWorkerAndJobType = jest.fn();

    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should throw ProficiencyLevelDeterminationError when proficiency data is incomplete or contradictory', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    mockAuthorizeOperation.mockResolvedValue({ authorized: true });

    mockGetWorkerById.mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      status: 'active',
    });

    const productivityData = Array.from({ length: 5 }, (_, i) => ({
      productivityDataId: `PD00${i}`,
      workerId: 'W001',
      workDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      productivityRate: 80 + i * 2,
      qualityScore: 85,
      jobType: i % 2 === 0 ? 'JobTypeA' : 'JobTypeB',
    }));

    mockGetLatestProductivityDataByWorker.mockResolvedValue(productivityData);

    mockGetLatestProficiencyByWorkerAndJobType.mockImplementation(
      (workerId, jobType) => {
        if (jobType === 'JobTypeA') {
          return Promise.resolve({
            jobType: 'JobTypeA',
            proficiencyLevel: null,
            evaluationDate: new Date(),
            dataSource: 'productivity_analysis',
          });
        }
        if (jobType === 'JobTypeB') {
          return Promise.resolve({
            jobType: 'JobTypeB',
            proficiencyLevel: 'intermediate',
            evaluationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
            dataSource: null,
          });
        }
        return Promise.resolve(null);
      }
    );

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
    };

    let errorThrown = false;
    let caughtError: Error | null = null;
    let result: Tx5Imp1AgentOutput | null = null;

    try {
      result = await runTx5Imp1Agent(input, mockAiClient as any);
    } catch (error) {
      errorThrown = true;
      caughtError = error as Error;
    }

    expect(errorThrown).toBe(true);
    expect(caughtError).not.toBeNull();
    expect(caughtError?.name).toBe('ProficiencyLevelDeterminationError');
    expect(caughtError?.message).toContain(
      '習熟度レベルを判定できません。必要なデータが不完全です。'
    );
    expect(result).toBeNull();
  });

  test('should not generate allocation plans when proficiency null score exists', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W002',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    mockAuthorizeOperation.mockResolvedValue({ authorized: true });

    mockGetWorkerById.mockResolvedValue({
      workerId: 'W002',
      workerName: 'Test Worker 2',
      status: 'active',
    });

    const productivityData = Array.from({ length: 5 }, (_, i) => ({
      productivityDataId: `PD10${i}`,
      workerId: 'W002',
      workDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      productivityRate: 75,
      qualityScore: 80,
      jobType: 'JobTypeA',
    }));

    mockGetLatestProductivityDataByWorker.mockResolvedValue(productivityData);

    mockGetLatestProficiencyByWorkerAndJobType.mockResolvedValue({
      jobType: 'JobTypeA',
      proficiencyLevel: null,
      evaluationDate: new Date(),
      dataSource: 'productivity_analysis',
    });

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
    };

    let errorThrown = false;
    let caughtError: Error | null = null;
    let result: Tx5Imp1AgentOutput | null = null;

    try {
      result = await runTx5Imp1Agent(input, mockAiClient as any);
    } catch (error) {
      errorThrown = true;
      caughtError = error as Error;
    }

    expect(errorThrown).toBe(true);
    expect(caughtError?.name).toBe('ProficiencyLevelDeterminationError');
    expect(caughtError?.message).toContain(
      '習熟度レベルを判定できません。必要なデータが不完全です。'
    );
    expect(result).toBeNull();
  });

  test('should handle stale evaluation date with missing data source as error', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W003',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    mockAuthorizeOperation.mockResolvedValue({ authorized: true });

    mockGetWorkerById.mockResolvedValue({
      workerId: 'W003',
      workerName: 'Test Worker 3',
      status: 'active',
    });

    const productivityData = Array.from({ length: 5 }, (_, i) => ({
      productivityDataId: `PD20${i}`,
      workerId: 'W003',
      workDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      productivityRate: 70 + i,
      qualityScore: 82,
      jobType: 'JobTypeB',
    }));

    mockGetLatestProductivityDataByWorker.mockResolvedValue(productivityData);

    mockGetLatestProficiencyByWorkerAndJobType.mockResolvedValue({
      jobType: 'JobTypeB',
      proficiencyLevel: 'advanced',
      evaluationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      dataSource: null,
    });

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
    };

    let errorThrown = false;
    let caughtError: Error | null = null;
    let result: Tx5Imp1AgentOutput | null = null;

    try {
      result = await runTx5Imp1Agent(input, mockAiClient as any);
    } catch (error) {
      errorThrown = true;
      caughtError = error as Error;
    }

    expect(errorThrown).toBe(true);
    expect(caughtError?.name).toBe('ProficiencyLevelDeterminationError');
    expect(caughtError?.message).toContain(
      '習熟度レベルを判定できません。必要なデータが不完全です。'
    );
    expect(result).toBeNull();
  });

  test('should throw error when proficiency determination fails', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W004',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    mockAuthorizeOperation.mockResolvedValue({ authorized: true });

    mockGetWorkerById.mockResolvedValue({
      workerId: 'W004',
      workerName: 'Test Worker 4',
      status: 'active',
    });

    const productivityData = Array.from({ length: 5 }, (_, i) => ({
      productivityDataId: `PD30${i}`,
      workerId: 'W004',
      workDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      productivityRate: 80,
      qualityScore: 85,
      jobType: 'JobTypeA',
    }));

    mockGetLatestProductivityDataByWorker.mockResolvedValue(productivityData);

    mockGetLatestProficiencyByWorkerAndJobType.mockImplementation(
      (workerId, jobType) => {
        if (jobType === 'JobTypeA') {
          return Promise.resolve({
            jobType: 'JobTypeA',
            proficiencyLevel: null,
            evaluationDate: new Date(),
            dataSource: 'productivity_analysis',
          });
        }
        return Promise.resolve(null);
      }
    );

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
    };

    let errorThrown = false;
    let caughtError: Error | null = null;

    try {
      await runTx5Imp1Agent(input, mockAiClient as any);
    } catch (error) {
      errorThrown = true;
      caughtError = error as Error;
    }

    expect(errorThrown).toBe(true);
    expect(caughtError?.name).toBe('ProficiencyLevelDeterminationError');
    expect(caughtError?.message).toContain(
      '習熟度レベルを判定できません。必要なデータが不完全です。'
    );
  });
});