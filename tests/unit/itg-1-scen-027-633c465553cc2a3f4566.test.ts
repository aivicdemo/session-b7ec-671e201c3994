import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-027: 入力パラメータ検証 - InvalidInputParameterError', () => {
  describe('facilityId が空文字列の場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: '',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024-01-01',
        analysisEndDate: '2024-12-31',
        executingUserId: 'user-123',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('analysisStartDate が ISO 8601 形式に準拠しない場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: 'invalid-date',
        analysisEndDate: '2024-12-31',
        executingUserId: 'user-123',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('analysisEndDate が null（必須項目の欠落）の場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024-01-01',
        analysisEndDate: null,
        executingUserId: 'user-123',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input as any, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('executingUserId が空文字列の場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024-01-01',
        analysisEndDate: '2024-12-31',
        executingUserId: '',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('autoApprovalEnabled が null（boolean 型ではない）の場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024-01-01',
        analysisEndDate: '2024-12-31',
        executingUserId: 'user-123',
        autoApprovalEnabled: null,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input as any, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('analysisStartDate が YYYY-MM-DD 形式に従わない場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024/01/01',
        analysisEndDate: '2024-12-31',
        executingUserId: 'user-123',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('analysisEndDate が analysisStartDate より前の日付の場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: 'facility-123',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: '2024-12-31',
        analysisEndDate: '2024-01-01',
        executingUserId: 'user-123',
        autoApprovalEnabled: true,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });

  describe('複数の不正項目がある場合', () => {
    it('InvalidInputParameterError がスロー・返却される', async () => {
      const input = {
        facilityId: '',
        teamId: null,
        workInstructionId: null,
        analysisStartDate: 'invalid-date',
        analysisEndDate: null,
        executingUserId: '',
        autoApprovalEnabled: null,
      };

      const mockAiClient = {};

      try {
        await runTx2Imp2Agent(input as any, mockAiClient);
        fail('InvalidInputParameterError should be thrown');
      } catch (error: any) {
        expect(error.message).toContain('入力パラメータが不正です。');
        expect(error.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails).toBeDefined();
        expect(error.errorDetails.errorCode).toBe('InvalidInputParameterError');
        expect(error.errorDetails.errorMessage).toBe('入力パラメータが不正です。');
        expect(error.errorDetails.affectedResourceId).toBeNull();
      }
    });
  });
});