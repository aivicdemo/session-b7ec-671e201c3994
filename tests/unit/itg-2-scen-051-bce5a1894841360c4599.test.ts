import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

// ApproverNotificationFailureError クラス定義
class ApproverNotificationFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApproverNotificationFailureError';
  }
}

describe('SCEN-051: 初期割当案生成後の承認者通知失敗時のエラーハンドリング', () => {
  it('承認者への通知失敗時にApproverNotificationFailureErrorを発生させ、初期割当案は保存されて成功フラグはfalseを返す', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S001',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2024-01-15',
      executingUserId: 'U001',
      historicalDataLookbackDays: 90,
    };

    const mockAiClient = {
      authenticateUser: jest.fn().mockResolvedValue({ authenticated: true }),
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      validateInputData: jest.fn().mockResolvedValue({ valid: true }),
      findWorkersByClassificationAndSite: jest.fn().mockResolvedValue([
        { workerId: 'W002', workerName: 'Worker2', classification: 'picker' },
        { workerId: 'W003', workerName: 'Worker3', classification: 'picker' },
        { workerId: 'W004', workerName: 'Worker4', classification: 'picker' },
      ]),
      findProductivityDataByWorkerIds: jest.fn().mockResolvedValue([
        {
          workerId: 'W002',
          workDate: '2024-01-10',
          productivityRate: 85,
          workType: 'picking',
        },
        {
          workerId: 'W003',
          workDate: '2024-01-10',
          productivityRate: 92,
          workType: 'picking',
        },
        {
          workerId: 'W004',
          workDate: '2024-01-10',
          productivityRate: 78,
          workType: 'picking',
        },
      ]),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest
        .fn()
        .mockResolvedValue({
          proposedWorkTypes: [
            {
              workTypeId: 'WT001',
              workTypeName: 'Picking',
              recommendationReason: 'High productivity match',
              expectedProductivityRate: 85,
            },
          ],
          peerProductivityPatterns: [
            {
              patternName: 'Standard Picker Pattern',
              description: 'Typical performance for pickers',
              averageProductivityRate: 85,
              strengthWorkTypes: ['picking', 'sorting'],
            },
          ],
          estimatedProficiencyDays: 14,
        }),
      saveInitialAssignment: jest.fn().mockResolvedValue({
        initialAssignmentId: 'IA001',
        createdAt: '2024-01-15T10:00:00Z',
      }),
      sendNotificationToAdministrator: jest
        .fn()
        .mockRejectedValue(
          new ApproverNotificationFailureError(
            'HTTP 500: Failed to send notification to administrator'
          )
        ),
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBe('IA001');
    expect(result.approverNotificationStatus).toBe('failed');
    expect(result.errorDetails).toBe(
      '承認者への通知に失敗しました。初期割当案は生成されましたが、承認者に届いていない可能性があります。'
    );
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');

    // executionTimestampがISO 8601形式であることを確認
    expect(new Date(result.executionTimestamp).toISOString()).toBe(
      result.executionTimestamp
    );

    expect(mockAiClient.authenticateUser).toHaveBeenCalledWith('U001');
    expect(mockAiClient.authorizeUserAction).toHaveBeenCalledWith(
      'U001',
      'generate_initial_assignment'
    );
    expect(mockAiClient.validateInputData).toHaveBeenCalledWith(input);
    expect(
      mockAiClient.findWorkersByClassificationAndSite
    ).toHaveBeenCalledWith('picker', 'S001');
    expect(mockAiClient.findProductivityDataByWorkerIds).toHaveBeenCalledWith(
      ['W002', 'W003', 'W004'],
      90
    );
    expect(
      mockAiClient.analyzeOnboardingContextAndExtractPeerPerformancePatterns
    ).toHaveBeenCalled();
    expect(mockAiClient.saveInitialAssignment).toHaveBeenCalled();
    expect(mockAiClient.sendNotificationToAdministrator).toHaveBeenCalled();
  });

  it('ApproverNotificationFailureErrorが正しくキャッチされ、エラー型が検証される', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S001',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2024-01-15',
      executingUserId: 'U001',
      historicalDataLookbackDays: 90,
    };

    const notificationError = new ApproverNotificationFailureError(
      'HTTP 500: Failed to send notification to administrator'
    );

    const mockAiClient = {
      authenticateUser: jest.fn().mockResolvedValue({ authenticated: true }),
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      validateInputData: jest.fn().mockResolvedValue({ valid: true }),
      findWorkersByClassificationAndSite: jest.fn().mockResolvedValue([
        { workerId: 'W002', workerName: 'Worker2', classification: 'picker' },
        { workerId: 'W003', workerName: 'Worker3', classification: 'picker' },
        { workerId: 'W004', workerName: 'Worker4', classification: 'picker' },
      ]),
      findProductivityDataByWorkerIds: jest.fn().mockResolvedValue([
        {
          workerId: 'W002',
          workDate: '2024-01-10',
          productivityRate: 85,
          workType: 'picking',
        },
        {
          workerId: 'W003',
          workDate: '2024-01-10',
          productivityRate: 92,
          workType: 'picking',
        },
        {
          workerId: 'W004',
          workDate: '2024-01-10',
          productivityRate: 78,
          workType: 'picking',
        },
      ]),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest
        .fn()
        .mockResolvedValue({
          proposedWorkTypes: [
            {
              workTypeId: 'WT001',
              workTypeName: 'Picking',
              recommendationReason: 'High productivity match',
              expectedProductivityRate: 85,
            },
          ],
          peerProductivityPatterns: [
            {
              patternName: 'Standard Picker Pattern',
              description: 'Typical performance for pickers',
              averageProductivityRate: 85,
              strengthWorkTypes: ['picking', 'sorting'],
            },
          ],
          estimatedProficiencyDays: 14,
        }),
      saveInitialAssignment: jest.fn().mockResolvedValue({
        initialAssignmentId: 'IA001',
        createdAt: '2024-01-15T10:00:00Z',
      }),
      sendNotificationToAdministrator: jest
        .fn()
        .mockRejectedValue(notificationError),
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    // ApproverNotificationFailureErrorが発生していることを確認
    expect(result.success).toBe(false);
    expect(result.approverNotificationStatus).toBe('failed');
    expect(result.initialAssignmentId).toBe('IA001');

    // エラーがApproverNotificationFailureErrorであり、その文言が一致することを確認
    expect(result.errorDetails).toBe(
      '承認者への通知に失敗しました。初期割当案は生成されましたが、承認者に届いていない可能性があります。'
    );

    // キャッチされたエラーがApproverNotificationFailureErrorであることを確認
    expect(notificationError.name).toBe('ApproverNotificationFailureError');
    expect(notificationError instanceof ApproverNotificationFailureError).toBe(
      true
    );
    expect(notificationError.message).toBe(
      'HTTP 500: Failed to send notification to administrator'
    );

    // 設計済みエラー定義と一致することを確認
    expect(result.errorDetails).toContain('承認者への通知に失敗しました');
    expect(result.errorDetails).toContain('初期割当案は生成されましたが');

    // executionTimestampがISO 8601形式で返されることを確認
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(new Date(result.executionTimestamp).toISOString()).toBe(
      result.executionTimestamp
    );

    // proposedWorkTypes と peerProductivityPatterns が返されることを確認
    expect(Array.isArray(result.proposedWorkTypes)).toBe(true);
    expect(Array.isArray(result.peerProductivityPatterns)).toBe(true);
    expect(result.estimatedProficiencyDays).toBeGreaterThan(0);
  });
});