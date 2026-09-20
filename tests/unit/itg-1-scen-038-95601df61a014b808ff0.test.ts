import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-038: facilityIdが空文字列の場合、InvalidInputParameterErrorが発生する', () => {
  it('should throw InvalidInputParameterError when facilityId is empty string', async () => {
    const input = {
      facilityId: '',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'user123',
      autoApprovalEnabled: true,
    };

    await expect(runTx2Imp2Agent(input, {} as any)).rejects.toThrow(
      expect.objectContaining({
        name: expect.stringMatching(/InvalidInputParameterError/i),
        message: expect.stringContaining('入力パラメータが不正です。'),
      })
    );
  });
});