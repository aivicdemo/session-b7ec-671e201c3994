import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-084: 習熟度が調整判定の閾値に達していない場合、継続監視を行う旨をエラーとして返す', () => {
  let mockValidateInputData: jest.Mock;
  let mockAnalyzeOnboardingContext: jest.Mock;
  let mockAnalyzeInitialAssignmentPerformance: jest.Mock;
  let mockAggregatePerformanceData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindPerformanceRecords: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockValidateInputData = jest.fn().mockResolvedValue({ isValid: true });
    
    mockAnalyzeOnboardingContext = jest.fn().mockResolvedValue({
      peerPerformancePatterns: [
        {
          workTypeId: 'WT001',
          workTypeName: 'picking',
          averageProductivityRate: 85,
          averageQualityScore: 88,
          averageTimeToThreshold: 25
        }
      ]
    });
    
    mockAnalyzeInitialAssignmentPerformance = jest.fn().mockResolvedValue({
      recommendedWorkTypeId: 'WT001',
      recommendedWorkTypeName: 'picking',
      recommendedDepartmentId: 'DEPT001',
      recommendationReason: 'Aptitude test shows strong affinity for basic picking tasks',
      peerPerformancePatterns: [
        {
          workTypeId: 'WT001',
          workTypeName: 'picking',
          averageProductivityRate: 85,
          averageQualityScore: 88,
          averageTimeToThreshold: 25
        }
      ],
      expectedProficiencyReachDays: 25
    });
    
    mockAggregatePerformanceData = jest.fn().mockResolvedValue({
      currentProficiencyLevel: 68,
      proficiencyTrendPercentage: 12.5,
      daysIntoMonitoring: 15,
      projectedThresholdReachDate: '2024-02-10',
      recentPerformanceMetrics: [
        {
          date: '2024-01-29',
          productivityRate: 68,
          qualityScore: 70,
          completedQuantity: 120
        },
        {
          date: '2024-01-28',
          productivityRate: 66,
          qualityScore: 68,
          completedQuantity: 115
        }
      ]
    });
    
    mockFindWorkerById = jest.fn().mockResolvedValue({
      id: 'A001',
      name: 'Test Worker',
      departmentId: 'DEPT001',
      status: 'active'
    });
    
    mockFindPerformanceRecords = jest.fn().mockResolvedValue([
      {
        date: '2024-01-29',
        productivityRate: 68,
        qualityScore: 70,
        completedQuantity: 120
      }
    ]);
  });

  it('should return monitoring_in_progress phase when proficiency level has not reached threshold', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.phase).toBe('monitoring_in_progress');
    expect(result.monitoringStatus).not.toBeNull();
    expect(result.difficultyAdjustmentRecommendation).toBeNull();
    expect(result.notificationSent).toBe(true);
  });

  it('should include ProficiencyThresholdNotReachedError in errors array', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors?.length).toBeGreaterThan(0);
    
    const thresholdError = result.errors?.find(
      err => err.code === 'ProficiencyThresholdNotReachedError'
    );
    expect(thresholdError).toBeDefined();
    expect(thresholdError?.message).toContain('習熟度が調整判定の閾値に達していません');
    expect(thresholdError?.message).toContain('継続監視を行います');
  });

  it('should have monitoring status with current proficiency level and trend', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.monitoringStatus).toBeDefined();
    expect(result.monitoringStatus?.currentProficiencyLevel).toBe(68);
    expect(result.monitoringStatus?.proficiencyTrendPercentage).toBe(12.5);
    expect(result.monitoringStatus?.daysIntoMonitoring).toBe(15);
    expect(result.monitoringStatus?.projectedThresholdReachDate).not.toBeNull();
    expect(result.monitoringStatus?.recentPerformanceMetrics).toBeDefined();
    expect(Array.isArray(result.monitoringStatus?.recentPerformanceMetrics)).toBe(true);
  });

  it('should not include difficulty adjustment recommendation when threshold not reached', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.difficultyAdjustmentRecommendation).toBeNull();
  });

  it('should send notification to administrator about continued monitoring', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.notificationSent).toBe(true);
  });

  it('should have valid execution timestamp in ISO 8601 format', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 65,
        fields: ['picking'],
        recommendations: ['basic_picking']
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
    };

    const aiClient = {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContext,
      analyzeInitialAssignmentPerformance: mockAnalyzeInitialAssignmentPerformance,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceData,
      findWorkerById: mockFindWorkerById,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecords
    };

    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, aiClient);

    expect(result.executionTimestamp).toBeDefined();
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });
});