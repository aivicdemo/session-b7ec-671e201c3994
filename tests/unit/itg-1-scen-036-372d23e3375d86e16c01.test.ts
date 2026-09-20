import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-036: 分析期間の開始日が終了日より後の場合、InvalidInputParameterErrorが発生する', () => {
  it('should throw InvalidInputParameterError when analysisStartDate is after analysisEndDate', async () => {
    const input = {
      facilityId: 'facility-123',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-31',
      analysisEndDate: '2024-01-01',
      executingUserId: 'user-456',
      autoApprovalEnabled: true,
    };

    await expect(runTx2Imp2Agent(input, {} as any)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
      errorCode: 'InvalidInputParameterError',
    });
  });
});