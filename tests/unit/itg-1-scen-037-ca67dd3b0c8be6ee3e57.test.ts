import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-037: analysisStartDate and analysisEndDate ISO 8601 format validation', () => {
  describe('Invalid ISO 8601 format detection', () => {
    it('should throw InvalidInputParameterError when analysisStartDate is invalid format (2024-13-45)', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '2024-13-45',
        analysisEndDate: '2024-12-31',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisEndDate is invalid format (2024-13-01)', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '2024-12-31',
        analysisEndDate: '2024-13-01',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisStartDate is not YYYY-MM-DD format (12/31/2024)', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '12/31/2024',
        analysisEndDate: '2024-12-31',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisStartDate is empty string', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '',
        analysisEndDate: '2024-12-31',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisEndDate is empty string', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '2024-12-01',
        analysisEndDate: '',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisStartDate has non-existent month (2024-13-15)', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '2024-13-15',
        analysisEndDate: '2024-12-31',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });

    it('should throw InvalidInputParameterError when analysisEndDate has non-existent day (2024-02-30)', async () => {
      const input = {
        facilityId: 'FAC001',
        teamId: null,
        workInstructionId: null,
        executingUserId: 'USR001',
        autoApprovalEnabled: true,
        analysisStartDate: '2024-02-01',
        analysisEndDate: '2024-02-30',
      };

      await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
        errorCode: 'InvalidInputParameterError',
        errorMessage: '入力パラメータが不正です。',
      });
    });
  });
});