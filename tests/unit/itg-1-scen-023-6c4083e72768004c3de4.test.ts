import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-023: 指定期間の生産性データが存在しない場合、ProductivityDataNotAvailableErrorが発生する', () => {
  it('should throw ProductivityDataNotAvailableError when no productivity data is available for the specified period', async () => {
    // Arrange: Mock dependencies
    const mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    const mockValidateReferentialIntegrity = jest.fn().mockResolvedValue(undefined);
    const mockListProductivityData = jest.fn().mockResolvedValue([]);
    const mockGetProductivityDataById = jest.fn().mockResolvedValue(null);

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getProductivityDataById: mockGetProductivityDataById,
    };

    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true,
    };

    // Act & Assert
    await expect(runTx2Imp2Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'ProductivityDataNotAvailableError',
        message: '生産性データが利用できません。ハンディターミナルおよびWMS連携ログを確認してください。',
      })
    );

    // Verify that authorization and validation were called
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(input.executingUserId);
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(input);
    expect(mockListProductivityData).toHaveBeenCalledWith({
      facilityId: input.facilityId,
      teamId: input.teamId,
      workInstructionId: input.workInstructionId,
      startDate: input.analysisStartDate,
      endDate: input.analysisEndDate,
    });
  });
});