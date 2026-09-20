import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/services/authorization.service');
jest.mock('../../src/services/delay-risk.service');
jest.mock('../../src/services/allocation.service');
jest.mock('../../src/services/worker.service');
jest.mock('../../src/services/persistence.service');

import * as authService from '../../src/services/authorization.service';
import * as delayRiskService from '../../src/services/delay-risk.service';
import * as allocationService from '../../src/services/allocation.service';
import * as workerService from '../../src/services/worker.service';
import * as persistenceService from '../../src/services/persistence.service';

describe('SCEN-045: エラー系：配置案生成時に利用可能作業者不足または習熟度データ不足で生成失敗エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupSuccessfulAuth = () => {
    (authService.authorizeOperation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
    });
  };

  const setupDelayRiskJudgment = () => {
    (delayRiskService.monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      riskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      riskLevel: 'high',
      riskScore: 85,
      delayPredictionDays: 2,
      currentProgressRate: 30,
      plannedProgressRate: 60,
      delayReasonClassification: 'personnel_shortage',
    });

    (persistenceService.saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      success: true,
    });
  };

  test('利用可能な作業者が空配列の場合、配置案生成失敗エラーが発生し、executionStatusがfailureになる', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();

    // Setup: getWorkerWithProficiencyAndProductivity returns empty array
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionStatus).toBe('failure');
    expect(output.errorDetails).not.toHaveLength(0);
    expect(output.errorDetails[0].errorCode).toBe('AllocationPlanGenerationFailure');
    expect(output.errorDetails[0].errorMessage).toContain('最適人員配置案の生成に失敗しました');
    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
    expect(output.generatedAllocationPlans).toHaveLength(0);
    expect(['pending_approval', 'rejected']).toContain(output.approvalStatus);
    expect(output.deliveryResults).toHaveLength(0);
    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('利用可能な作業者がnullの場合、配置案生成失敗エラーが発生する', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();

    // Setup: getWorkerWithProficiencyAndProductivity returns null
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue(null);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-002'],
      teamIds: ['team-002'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionStatus).toBe('failure');
    expect(output.errorDetails.length).toBeGreaterThan(0);
    expect(output.errorDetails[0].errorCode).toBe('AllocationPlanGenerationFailure');
    expect(output.errorDetails[0].errorMessage).toContain('最適人員配置案の生成に失敗しました');
    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
    expect(output.generatedAllocationPlans).toHaveLength(0);
  });

  test('習熟度データがnullの場合、配置案生成失敗エラーが発生する', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();

    // Setup: getWorkerWithProficiencyAndProductivity returns workers with null proficiency level
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: null,
        allocatedWorkHours: 8,
        expectedProductivityRate: 85,
      },
    ]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionStatus).toBe('failure');
    expect(output.errorDetails.length).toBeGreaterThan(0);
    expect(output.errorDetails[0].errorCode).toBe('AllocationPlanGenerationFailure');
    expect(output.errorDetails[0].errorMessage).toContain('最適人員配置案の生成に失敗しました');
    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
    expect(output.generatedAllocationPlans).toHaveLength(0);
  });

  test('習熟度データがundefinedの場合、配置案生成失敗エラーが発生する', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();

    // Setup: getWorkerWithProficiencyAndProductivity returns workers with undefined proficiency level
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: undefined,
        allocatedWorkHours: 8,
        expectedProductivityRate: 85,
      },
    ]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionStatus).toBe('failure');
    expect(output.errorDetails.length).toBeGreaterThan(0);
    expect(output.errorDetails[0].errorCode).toBe('AllocationPlanGenerationFailure');
    expect(output.errorDetails[0].errorMessage).toContain('最適人員配置案の生成に失敗しました');
    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
    expect(output.generatedAllocationPlans).toHaveLength(0);
  });

  test('習熟度データが空値の場合、配置案生成失敗エラーが発生する', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();

    // Setup: getWorkerWithProficiencyAndProductivity returns workers with empty string proficiency level
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: '',
        allocatedWorkHours: 8,
        expectedProductivityRate: 85,
      },
    ]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionStatus).toBe('failure');
    expect(output.errorDetails.length).toBeGreaterThan(0);
    expect(output.errorDetails[0].errorCode).toBe('AllocationPlanGenerationFailure');
    expect(output.errorDetails[0].errorMessage).toContain('最適人員配置案の生成に失敗しました');
    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
    expect(output.generatedAllocationPlans).toHaveLength(0);
  });

  test('errorDetailsにaffectedFacilityIdとaffectedTeamIdが格納される', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.errorDetails[0].affectedFacilityId).toBe('fac-001');
    expect(output.errorDetails[0].affectedTeamId).toBe('team-001');
  });

  test('errorTimestampがISO 8601形式である', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    const errorTimestamp = output.errorDetails[0].errorTimestamp;
    expect(() => new Date(errorTimestamp)).not.toThrow();
    expect(errorTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('delayRiskJudgmentResultsには判定結果が含まれる', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskJudgmentId');
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskLevel');
  });

  test('approvalStatusがpending_approvalまたはrejectedである', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(['pending_approval', 'rejected']).toContain(output.approvalStatus);
  });

  test('executionIdが一意の文字列として設定される', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);
  });

  test('executionTimestampがISO 8601形式である', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(() => new Date(output.executionTimestamp)).not.toThrow();
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('エラー情報に利用可能な作業者と習熟度情報の確認を促すメッセージが含まれる', async () => {
    setupSuccessfulAuth();
    setupDelayRiskJudgment();
    (workerService.getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValue([]);

    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    expect(output.errorDetails[0].errorMessage).toContain('利用可能な作業者');
    expect(output.errorDetails[0].errorMessage).toContain('習熟度情報');
  });
});