import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-5-imp-2/orchestrator';

jest.mock('../../src/agents/tx-5-imp-2/orchestrator', () => ({
  ...jest.requireActual('../../src/agents/tx-5-imp-2/orchestrator'),
  validateInputData: jest.fn(),
}));

describe('SCEN-091: validateInputDataの検証に合格する', () => {
  let validateInputDataSpy: jest.SpyInstance;

  beforeEach(() => {
    validateInputDataSpy = jest.spyOn(orchestratorModule as any, 'validateInputData').mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('入力データがvalidateInputDataの検証に合格して、エラーなしでエージェント出力を返す', async () => {
    // Arrange
    const input = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 85,
        field1: 'picking',
        field2: 'accuracy',
      },
      assignmentStartDate: '2025-01-15T00:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding' as const,
    };

    // Act
    const result = await runTx5Imp2Agent(input, {} as any);

    // Assert
    expect(validateInputDataSpy).toHaveBeenCalledTimes(1);
    expect(result.errors).toEqual([]);
    expect(result.phase).toMatch(
      /^(initial_assignment_recommendation|monitoring_in_progress|proficiency_threshold_reached|monitoring_completed)$/
    );
    expect(typeof result.notificationSent).toBe('boolean');
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});