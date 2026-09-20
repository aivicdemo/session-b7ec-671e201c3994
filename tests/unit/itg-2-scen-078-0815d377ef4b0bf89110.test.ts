import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-078: 過去実績データ不足時の警告処理', () => {
  it('同じ職務分類・拠点の過去実績データが3件未満の場合、警告を含めて処理を続行する', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 82,
        proficientAreas: ['組立'],
        recommendedDuties: ['精密組立'],
      },
      assignmentStartDate: '2024-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const response: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input);

    expect(response).toBeDefined();
    expect(response.phase).toBe('initial_assignment_recommendation');

    expect(response.initialAssignmentRecommendation).toBeDefined();
    expect(response.initialAssignmentRecommendation?.recommendedWorkTypeId).toBeDefined();
    expect(response.initialAssignmentRecommendation?.recommendedWorkTypeName).toBeDefined();
    expect(response.initialAssignmentRecommendation?.recommendedDepartmentId).toBeDefined();
    expect(response.initialAssignmentRecommendation?.recommendationReason).toBeDefined();

    expect(response.notificationSent).toBe(true);

    expect(response.executionTimestamp).toBeDefined();
    const timestamp = new Date(response.executionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(isNaN(timestamp.getTime())).toBe(false);

    expect(response.errors).toBeDefined();
    expect(Array.isArray(response.errors)).toBe(true);

    const insufficientDataError = response.errors?.find(
      (err) => err.code === 'InsufficientPeerDataError'
    );
    expect(insufficientDataError).toBeDefined();
    expect(insufficientDataError?.message).toContain('参考となる過去実績データが不足しています');
    expect(insufficientDataError?.message).toContain('初期割当推奨の精度が低下する可能性があります');
  });
});