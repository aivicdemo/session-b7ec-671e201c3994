import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/logic/authorization-and-validation.ts');
jest.mock('../../src/logic/progress-monitoring.ts');
jest.mock('../../src/logic/data-collection-orchestration.ts');
jest.mock('../../src/logic/personnel-reallocation-judgment.ts');

import * as authModule from '../../src/logic/authorization-and-validation.ts';
import * as progressModule from '../../src/logic/progress-monitoring.ts';
import * as dataCollectionModule from '../../src/logic/data-collection-orchestration.ts';
import * as personnelModule from '../../src/logic/personnel-reallocation-judgment.ts';

describe('Tx4Imp1Agent - No Delay Risk Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty detectedDelayRisks when no delay risk is detected', async () => {
    // Arrange - Mock authenticateUser to indicate valid authorization
    (authModule.authenticateUser as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: 'valid-user-id',
      isAuthorized: true,
    });

    // Mock monitorProgressAndDetectDelayRisk to return no delay risks
    (progressModule.monitorProgressAndDetectDelayRisk as jest.Mock).mockResolvedValue({
      detectedRisks: [],
      monitoringTimestamp: new Date().toISOString(),
    });

    // Mock orchestrateDataCollectionForDelayRisk to return normal data collection results
    (dataCollectionModule.orchestrateDataCollectionForDelayRisk as jest.Mock).mockResolvedValue({
      progressData: [],
      productivityData: [],
      collectionStatus: 'success',
    });

    // Mock judgePersonnelReallocationFeasibility to return reallocation judgment
    (personnelModule.judgePersonnelReallocationFeasibility as jest.Mock).mockResolvedValue({
      isFeasible: false,
      reasons: [],
    });

    const input: Tx4Imp1AgentInput = {
      triggerType: 'realtime_monitoring',
      monitoringIntervalSeconds: 300,
      targetSiteIds: [],
      delayRiskThreshold: 70,
      executingUserId: 'valid-user-id',
      contextData: {},
    };

    // Act
    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authenticateUser: authModule.authenticateUser,
      monitorProgressAndDetectDelayRisk: progressModule.monitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: dataCollectionModule.orchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: personnelModule.judgePersonnelReallocationFeasibility,
    } as any);

    // Assert
    expect(result.executionStatus).toBe('success');
    expect(result.detectedDelayRisks).toEqual([]);
    expect(Array.isArray(result.detectedDelayRisks)).toBe(true);
    expect(result.detectedDelayRisks.length).toBe(0);

    expect(result.affectedSites).toEqual([]);
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBe(0);

    expect(result.placementProposals).toEqual([]);
    expect(Array.isArray(result.placementProposals)).toBe(true);
    expect(result.placementProposals.length).toBe(0);

    expect(result.deliveryInstructions).toEqual([]);
    expect(Array.isArray(result.deliveryInstructions)).toBe(true);
    expect(result.deliveryInstructions.length).toBe(0);

    expect(result.errorDetails).toBeNull();

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});