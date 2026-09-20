import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as persistenceLayer from '../../src/persistence/performance-records';
import * as validationLayer from '../../src/validation/input-validation';

describe('SCEN-338: 習熟度評価に必要な最小件数に満たないときにInsufficientDataForAnalysisErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InsufficientDataForAnalysisError when performance records are insufficient for proficiency evaluation', async () => {
    // テストデータの準備
    const workerId = 'worker-001';
    const initialAssignmentId = 'assignment-001';
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = now;
    const requestingUserId = 'leader-001';

    // 永続化層のスタブ設定
    const mockWorker = {
      workerId,
      workerName: 'Test Worker',
      baseId: 'base-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operationStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockInitialAssignment = {
      assignmentId: initialAssignmentId,
      workerId,
      departmentName: 'Manufacturing',
      processName: 'Assembly',
      assignmentStartDate: new Date(),
      assignmentStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: requestingUserId,
    };

    // 2つの異なる作業タイプのみの実績記録（最小件数3件未満）
    const mockPerformanceRecords = [
      {
        performanceRecordId: 'record-001',
        workerId,
        configurationPlanId: 'plan-001',
        workDate: new Date(analysisStartDateTime.getTime() + 2 * 60 * 60 * 1000),
        workContent: 'Assembly Task Type 1',
        completedQuantity: 50,
        requiredTimeMinutes: 120,
        qualityScore: 85,
        remarks: 'First work type',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: workerId,
      },
      {
        performanceRecordId: 'record-002',
        workerId,
        configurationPlanId: 'plan-001',
        workDate: new Date(analysisStartDateTime.getTime() + 8 * 60 * 60 * 1000),
        workContent: 'Assembly Task Type 2',
        completedQuantity: 45,
        requiredTimeMinutes: 110,
        qualityScore: 82,
        remarks: 'Second work type',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: workerId,
      },
    ];

    jest.spyOn(persistenceLayer, 'findWorkerById').mockResolvedValue(mockWorker as any);
    jest.spyOn(persistenceLayer, 'findInitialAssignmentByWorker').mockResolvedValue(mockInitialAssignment as any);
    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByWorkerAndPeriod').mockResolvedValue(mockPerformanceRecords as any);

    // 入力値検証のスタブ設定
    jest.spyOn(validationLayer, 'validateInputData').mockResolvedValue(true);

    // 分析対象処理を呼び出す
    try {
      await analyzeInitialAssignmentPerformance({
        workerId,
        initialAssignmentId,
        analysisStartDateTime,
        analysisEndDateTime,
        requestingUserId,
      });
      // エラーが発生していない場合は失敗
      fail('InsufficientDataForAnalysisError should be thrown');
    } catch (error: any) {
      // 発生するエラーを捕捉して検証
      expect(error.name).toBe('InsufficientDataForAnalysisError');
      expect(error.message).toBe(
        '習熟度評価に必要な最小限のデータが不足しています。より多くの作業実績が必要です。',
      );
    }
  });
});