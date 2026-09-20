import { jest } from '@jest/globals';
import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';

class DataRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataRetrievalError';\n  }
}

// Mock the dependency modules
jest.mock('../../src/logic/worker-repository', () => ({
  findWorkerById: jest.fn(),
}));

jest.mock('../../src/logic/authorization-service', () => ({
  authorizeUserAction: jest.fn(),
}));

jest.mock('../../src/logic/productivity-data-repository', () => ({
  findProductivityDataByWorkerAndPeriod: jest.fn(),
}));

jest.mock('../../src/logic/performance-record-repository', () => ({
  findPerformanceRecordByWorker: jest.fn(),
}));

jest.mock('../../src/logic/initial-assignment-repository', () => ({
  findInitialAssignmentByWorker: jest.fn(),
}));

jest.mock('../../src/logic/assignment-performance-comparison-service', () => ({
  buildInitialAssignmentAndPerformanceComparison: jest.fn(),
}));

jest.mock('../../src/logic/quality-variance-detection-service', () => ({
  detectAndFormatQualityVarianceAlerts: jest.fn(),
}));

jest.mock('../../src/logic/proficiency-level-service', () => ({
  calculateProficiencyLevel: jest.fn(),
}));

jest.mock('../../src/logic/data-accumulation-service', () => ({
  formatProductivityDataAccumulationStatus: jest.fn(),
}));

jest.mock('../../src/logic/time-series-formatting-service', () => ({
  formatProductivityTimeSeriesData: jest.fn(),
}));

describe('SCEN-369: 生産性データまたは実績記録の取得に失敗した場合', () => {
  let findWorkerByIdMock: jest.Mock;
  let authorizeUserActionMock: jest.Mock;
  let findProductivityDataByWorkerAndPeriodMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const workerModule = require('../../src/logic/worker-repository');
    const authModule = require('../../src/logic/authorization-service');
    const productivityModule = require('../../src/logic/productivity-data-repository');

    findWorkerByIdMock = workerModule.findWorkerById;
    authorizeUserActionMock = authModule.authorizeUserAction;
    findProductivityDataByWorkerAndPeriodMock = productivityModule.findProductivityDataByWorkerAndPeriod;

    // Setup: findWorkerById を成功させ、有効な作業者オブジェクトを返す
    findWorkerByIdMock.mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      departmentName: 'Test Department',
      jobTitle: 'Test Job',
      operationStatus: '稼働中',
    });

    // Setup: authorizeUserAction を成功させ、権限があることを返す
    authorizeUserActionMock.mockResolvedValue(true);

    // Setup: findProductivityDataByWorkerAndPeriod を失敗させ、DataRetrievalError を発生させる
    findProductivityDataByWorkerAndPeriodMock.mockRejectedValue(
      new DataRetrievalError('データの取得に失敗しました。')
    );
  });

  it('DataRetrievalErrorが発生する', async () => {
    await expect(
      renderProductivityDashboard({
        workerId: 'W001',
        userId: 'U123',
        collectionPeriodStartDate: '2024-11-01',
        collectionPeriodEndDate: '2024-12-01',
        workTypeFilter: [],
      })
    ).rejects.toMatchObject({
      name: 'DataRetrievalError',
      message: 'データの取得に失敗しました。',
    });

    // Verify that findWorkerById was called
    expect(findWorkerByIdMock).toHaveBeenCalledWith('W001');

    // Verify that authorizeUserAction was called
    expect(authorizeUserActionMock).toHaveBeenCalledWith('U123', 'W001');

    // Verify that findProductivityDataByWorkerAndPeriod was called
    expect(findProductivityDataByWorkerAndPeriodMock).toHaveBeenCalledWith(
      'W001',
      '2024-11-01',
      '2024-12-01'
    );
  });
});