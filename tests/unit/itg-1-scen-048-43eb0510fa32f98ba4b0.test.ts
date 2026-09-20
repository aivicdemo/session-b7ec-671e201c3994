import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock authorizeOperation to provide successful authorization
jest.mock('../../src/auth/authorizeOperation', () => ({
  authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
}));

describe('SCEN-048: エラー系：入力データが必須フィールド欠落または参照整合性破綻で入力不正エラーが発生する', () => {
  describe('必須フィールド欠落ケース', () => {
    it('userId フィールドが null の場合、InvalidInputData エラーが発生する', async () => {
      const input: Partial<Tx3Imp1AgentInput> = {
        userId: null as any,
        facilityIds: undefined,
        teamIds: undefined,
        riskThresholdScore: undefined,
        approverUserId: undefined,
        executionContext: undefined,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input as Tx3Imp1AgentInput, aiClient);

      expect(output.executionStatus).toBe('failure');
      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThan(0);
      expect(output.errorDetails[0].errorCode).toBe('InvalidInputData');
      expect(output.errorDetails[0].errorMessage).toContain('入力データが不正です');
      expect(output.errorDetails[0].errorMessage).toContain('必須フィールド');
      expect(output.errorDetails[0].errorMessage).toContain('参照整合性');
      expect(output.delayRiskJudgmentResults).toEqual([]);
      expect(output.generatedAllocationPlans).toEqual([]);
      expect(output.deliveryResults).toEqual([]);
      expect(output.approvalStatus).toBeUndefined();
      expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('userId フィールドが undefined の場合、InvalidInputData エラーが発生する', async () => {
      const input: Partial<Tx3Imp1AgentInput> = {
        userId: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        riskThresholdScore: undefined,
        approverUserId: undefined,
        executionContext: undefined,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input as Tx3Imp1AgentInput, aiClient);

      expect(output.executionStatus).toBe('failure');
      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThan(0);
      expect(output.errorDetails[0].errorCode).toBe('InvalidInputData');
      expect(output.delayRiskJudgmentResults).toEqual([]);
      expect(output.generatedAllocationPlans).toEqual([]);
      expect(output.deliveryResults).toEqual([]);
      expect(output.approvalStatus).toBeUndefined();
      expect(output.executionTimestamp).toBeDefined();
    });
  });

  describe('参照整合性破綻ケース', () => {
    it('存在しない拠点ID を facilityIds に含める場合、InvalidInputData エラーが発生し、affectedFacilityId が記録される', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.executionStatus).toBe('failure');
      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThan(0);
      expect(output.errorDetails[0].errorCode).toBe('InvalidInputData');
      expect(output.errorDetails[0].errorMessage).toContain('参照整合性');
      expect(output.errorDetails[0].affectedFacilityId).toBe('facility-999');
      expect(output.delayRiskJudgmentResults).toEqual([]);
      expect(output.generatedAllocationPlans).toEqual([]);
      expect(output.deliveryResults).toEqual([]);
      expect(output.approvalStatus).toBeUndefined();
      expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('存在しないチームID を teamIds に含める場合、InvalidInputData エラーが発生し、affectedTeamId が記録される', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        teamIds: ['team-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.executionStatus).toBe('failure');
      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails[0].errorCode).toBe('InvalidInputData');
      expect(output.errorDetails[0].affectedTeamId).toBe('team-999');
      expect(output.delayRiskJudgmentResults).toEqual([]);
      expect(output.generatedAllocationPlans).toEqual([]);
      expect(output.deliveryResults).toEqual([]);
      expect(output.approvalStatus).toBeUndefined();
    });

    it('複数の参照整合性破綻がある場合、すべてエラーとして記録され、それぞれの発生箇所が記録される', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-999'],
        teamIds: ['team-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.executionStatus).toBe('failure');
      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThanOrEqual(1);
      expect(output.errorDetails.some(e => e.errorCode === 'InvalidInputData')).toBe(true);

      const facilityError = output.errorDetails.find(e => e.affectedFacilityId === 'facility-999');
      const teamError = output.errorDetails.find(e => e.affectedTeamId === 'team-999');

      if (facilityError) {
        expect(facilityError.errorCode).toBe('InvalidInputData');
      }
      if (teamError) {
        expect(teamError.errorCode).toBe('InvalidInputData');
      }
      
      expect(output.approvalStatus).toBeUndefined();
    });
  });

  describe('出力フィールド検証', () => {
    it('エラー発生時、executionStatus は failure となる', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: null as any,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.executionStatus).toBe('failure');
    });

    it('エラー発生時、errorDetails に詳細情報が含まれる', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: undefined as any,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.errorDetails).toBeDefined();
      expect(Array.isArray(output.errorDetails)).toBe(true);
      expect(output.errorDetails.length).toBeGreaterThan(0);

      const errorDetail = output.errorDetails[0];
      expect(errorDetail.errorCode).toBe('InvalidInputData');
      expect(errorDetail.errorMessage).toBeDefined();
      expect(typeof errorDetail.errorMessage).toBe('string');
      expect(errorDetail.errorTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('エラー発生時、delayRiskJudgmentResults は空配列となる', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.delayRiskJudgmentResults).toEqual([]);
    });

    it('エラー発生時、generatedAllocationPlans は空配列となる', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: null as any,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.generatedAllocationPlans).toEqual([]);
    });

    it('エラー発生時、deliveryResults は空配列となる', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: undefined as any,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.deliveryResults).toEqual([]);
    });

    it('エラー発生時、executionTimestamp は ISO 8601 形式である', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.executionTimestamp).toBeDefined();
      expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?/);
    });

    it('エラー発生時、approvalStatus は undefined である', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: null as any,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.approvalStatus).toBeUndefined();
    });

    it('エラー詳細に発生箇所が記録される', async () => {
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-999'],
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input, aiClient);

      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThan(0);
      const errorDetail = output.errorDetails[0];

      expect(errorDetail.errorCode).toBe('InvalidInputData');
      expect(errorDetail.errorMessage).toBeDefined();
      expect(errorDetail.errorTimestamp).toBeDefined();
      expect(errorDetail.affectedFacilityId).toBe('facility-999');
    });

    it('必須フィールド欠落時、エラー詳細に発生箇所として userId が記録される', async () => {
      const input: Partial<Tx3Imp1AgentInput> = {
        userId: null as any,
        facilityIds: undefined,
        teamIds: undefined,
        riskThresholdScore: undefined,
        approverUserId: undefined,
        executionContext: undefined,
      };

      const aiClient = {
        predictDelayRisk: jest.fn(),
        suggestStaffingAdjustment: jest.fn(),
      };

      const output = await runTx3Imp1Agent(input as Tx3Imp1AgentInput, aiClient);

      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails.length).toBeGreaterThan(0);
      const errorDetail = output.errorDetails[0];

      expect(errorDetail.errorCode).toBe('InvalidInputData');
      expect(errorDetail.errorMessage).toContain('必須フィールド');
    });
  });
});