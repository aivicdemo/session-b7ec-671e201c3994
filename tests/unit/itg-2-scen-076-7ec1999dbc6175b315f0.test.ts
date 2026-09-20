import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-076: Tx5Imp2Agent - NewAssignee not found error handling', () => {
  it('should return error when newAssigneeId does not exist in worker master', async () => {
    const nonexistentWorkerId = 'NONEXISTENT_WORKER_12345';

    const input: Tx5Imp2AgentInput = {
      newAssigneeId: nonexistentWorkerId,
      aptitudeTestResult: {
        totalScore: 85,
        competencyAreas: ['assembly', 'quality_check'],
        recommendedJobTypes: ['assembly_line', 'inspection'],
      },
      assignmentStartDate: new Date().toISOString(),
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    let result: Tx5Imp2AgentOutput | undefined;
    let thrownError: Error | undefined;

    try {
      result = await runTx5Imp2Agent(input, {
        // AI client implementation would go here
      } as any);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    if (thrownError) {
      expect(thrownError.name).toBe('NewAssigneeNotFoundError');
      expect(thrownError.message).toContain('新配属者が見つかりません');
      expect(thrownError.message).toContain('配属情報を確認してください');
    } else if (result) {
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'NewAssigneeNotFoundError',
            message: '新配属者が見つかりません。配属情報を確認してください。',
          }),
        ]),
      );
      expect(result.initialAssignmentRecommendation).toBeNull();
      expect(result.monitoringStatus).toBeNull();
      expect(result.difficultyAdjustmentRecommendation).toBeNull();
      expect(result.monitoringCompletionSummary).toBeNull();
    } else {
      fail('Expected either an error to be thrown or errors in result');
    }
  });
});