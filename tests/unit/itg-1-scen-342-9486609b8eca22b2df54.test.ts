import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

// モック定義を describe の外で行う
jest.mock('../../src/validators/datetime-validator');
jest.mock('../../src/validators/quantity-validator');
jest.mock('../../src/validators/referential-integrity-validator');
jest.mock('../../src/repositories/worker-repository');
jest.mock('../../src/repositories/work-instruction-repository');
jest.mock('../../src/repositories/proficiency-repository');
jest.mock('../../src/calculations/productivity-calculator');
jest.mock('../../src/services/audit-service');

describe('SCEN-342: ハンディターミナルとWMSからの矛盾データ処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 各モジュールをインポートしてモック設定を行う
    const datetimeValidator = require('../../src/validators/datetime-validator');
    datetimeValidator.validateDateTimeRange = jest.fn().mockResolvedValue(true);

    const quantityValidator = require('../../src/validators/quantity-validator');
    quantityValidator.validateNumericQuantity = jest.fn().mockResolvedValue(true);

    const referentialIntegrityValidator = require('../../src/validators/referential-integrity-validator');
    referentialIntegrityValidator.validateReferentialIntegrity = jest
      .fn()
      .mockResolvedValue(true);

    const workerRepository = require('../../src/repositories/worker-repository');
    workerRepository.getWorkerById = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      facilityId: 'F001',
      teamId: 'T001',
      professionCode: 'PROF001',
      status: '稼働中'
    });

    const workInstructionRepository = require('../../src/repositories/work-instruction-repository');
    workInstructionRepository.getWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Test Work',
      plannedHours: 4
    });

    const proficiencyRepository = require('../../src/repositories/proficiency-repository');
    proficiencyRepository.getProficiencyById = jest.fn().mockResolvedValue({
      proficiencyId: 'PR001',
      proficiencyLevel: 3,
      evaluationDate: '2024-01-01T00:00:00Z'
    });

    const productivityCalculator = require('../../src/calculations/productivity-calculator');
    productivityCalculator.calculateProductivityRate = jest.fn().mockReturnValue(95);
    productivityCalculator.calculateWorkHours = jest.fn().mockReturnValue(4.0);
    productivityCalculator.judgeProficiencyLevel = jest.fn().mockReturnValue('中級');

    const auditService = require('../../src/services/audit-service');
    auditService.recordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'AUD001',
      success: true
    });
  });

  it('ハンディターミナルとWMSから同一作業指示に対して矛盾する数量が取得された場合、出力にデータ矛盾情報が含まれる', async () => {
    // ステップ1: ハンディターミナル作業実績データを作成
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        errorCount: 2,
        remarks: 'ハンディターミナル実績'
      }
    ];

    // ステップ2: WMS作業実績データを作成（矛盾する数量）
    const wmsWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 95,
        defectQuantity: 5,
        remarks: 'WMS実績'
      }
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'ADMIN001';

    // ステップ11: aggregateWorkResultsAndCalculateProductivityを呼び出し
    const result = await aggregateWorkResultsAndCalculateProductivity({
      handyTerminalWorkResults,
      wmsWorkResults,
      aggregationDate,
      executingUserId
    });

    // 期待結果の検証

    // 1. aggregatedProductivityDataに少なくとも1件のレコードが含まれることを確認
    expect(result.aggregatedProductivityData).toBeDefined();
    expect(Array.isArray(result.aggregatedProductivityData)).toBe(true);
    expect(result.aggregatedProductivityData.length).toBeGreaterThanOrEqual(1);

    const productivityRecord = result.aggregatedProductivityData[0];
    expect(productivityRecord).toHaveProperty('productivityDataId');
    expect(productivityRecord).toHaveProperty('workResultId');
    expect(productivityRecord).toHaveProperty('productivityRate');
    expect(productivityRecord).toHaveProperty('qualityScore');
    expect(productivityRecord).toHaveProperty('errorCount');
    expect(typeof productivityRecord.productivityRate).toBe('number');
    expect(typeof productivityRecord.qualityScore).toBe('number');
    expect(typeof productivityRecord.errorCount).toBe('number');

    // 2. dataConflictsフィールドが存在し、矛盾情報を含むことを確認
    expect(result.dataConflicts).toBeDefined();
    expect(Array.isArray(result.dataConflicts)).toBe(true);
    expect(result.dataConflicts.length).toBeGreaterThanOrEqual(1);

    const conflict = result.dataConflicts[0];
    expect(conflict.workInstructionId).toBe('WI-001');
    expect(conflict.workerId).toBe('W001');
    expect(conflict.handyTerminalQuantity).toBe(100);
    expect(conflict.wmsQuantity).toBe(95);
    expect(conflict.conflictReason).toBeDefined();
    expect(typeof conflict.conflictReason).toBe('string');
    expect(conflict.conflictReason.length).toBeGreaterThan(0);

    // 3. processingStatisticsが存在し、conflictRecords >= 1であることを確認
    expect(result.processingStatistics).toBeDefined();
    expect(result.processingStatistics.conflictRecords).toBeGreaterThanOrEqual(1);
    expect(typeof result.processingStatistics.totalRecordsProcessed).toBe('number');
    expect(typeof result.processingStatistics.successfullyAggregated).toBe('number');
    expect(typeof result.processingStatistics.failedRecords).toBe('number');
    expect(typeof result.processingStatistics.processingDurationMs).toBe('number');

    // 4. persistenceResultが存在し、適切なステータスを持つことを確認
    expect(result.persistenceResult).toBeDefined();
    expect(['success', 'partial_failure', 'failure']).toContain(
      result.persistenceResult.persistenceStatus
    );
    expect(typeof result.persistenceResult.savedProductivityRecords).toBe('number');
    expect(typeof result.persistenceResult.savedWorkResultRecords).toBe('number');

    // 5. エラーが発生していないこと（DataSyncConflictErrorが投げられていない）を確認
    // この検証は、上記のアサーションが全て成功することで満たされる
    // dataConflictsが情報として出力されており、エラーとして扱われていない
    expect(result).toBeDefined();
    expect(result.aggregatedProductivityData).toBeDefined();
  });
});