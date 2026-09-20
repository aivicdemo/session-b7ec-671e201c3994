import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';
import { AnalyzeOnboardingContextInput } from '../../src/logic/new-assignee-onboarding-analysis';

jest.mock('../../src/repository/worker-repository');
jest.mock('../../src/repository/productivity-data-repository');
jest.mock('../../src/repository/performance-records-repository');
jest.mock('../../src/validation/onboarding-input-validator');

describe('SCEN-326: 過去実績データが全く存在しない場合の warn ログ出力', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const workerRepositoryModule = require('../../src/repository/worker-repository');
    const productivityRepositoryModule = require('../../src/repository/productivity-data-repository');
    const performanceRepositoryModule = require('../../src/repository/performance-records-repository');
    const validatorModule = require('../../src/validation/onboarding-input-validator');

    validatorModule.validateInputData = jest.fn().mockResolvedValue(true);

    workerRepositoryModule.findWorkersByClassificationAndSite = jest.fn().mockResolvedValue([
      { workerId: 'WKR-001', workerName: '作業者1' },
      { workerId: 'WKR-002', workerName: '作業者2' },
      { workerId: 'WKR-003', workerName: '作業者3' },
    ]);

    productivityRepositoryModule.findProductivityDataByWorkerIds = jest.fn().mockResolvedValue([]);

    performanceRepositoryModule.findPerformanceRecordsByWorkerIds = jest.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    warnSpy.mockRestore();
  });

  it('should return insufficient_data status and output warn log when no historical data exists', async () => {
    const input: AnalyzeOnboardingContextInput = {
      newAssigneeName: '田中太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15',
      jobClassification: '仕分け作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-100',
    };

    const result = await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(result.analysisStatus).toBe('insufficient_data');
    expect(result.strengthWorkTypes).toEqual([]);
    expect(result.productivityPatterns).toEqual([]);
    expect(result.recommendedInitialWorkTypes).toEqual([]);
    expect(result.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('参考データが不足しています。手動で初期割当を決定してください')
    );
  });
});