import { notifyPlacementProposalRejection } from '../../src/logic/notification-and-integration';

describe('notifyPlacementProposalRejection - Error Case', () => {
  it('should return PlacementProposalNotFound error when proposal ID does not exist', async () => {
    const input = {
      proposalId: 'non-existent-proposal-12345',
      rejectionReason: 'BUSINESS_CONSTRAINT' as const,
      rejectionReasonDetail: 'テスト却下',
      nextActionInstruction: '別案を再提案してください',
      affectedWorkerIds: ['worker-001'],
      relatedAnalysisId: null,
      notifyFieldLeaders: true,
      notifyAdministrators: true,
      deliveryChannels: ['EMAIL'] as const[],
      requestedBy: 'user-admin-001',
      priorityLevel: 'MEDIUM' as const,
    };

    let error: any;
    try {
      await notifyPlacementProposalRejection(input);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('PlacementProposalNotFound');
    expect(error.message).toContain('配置案が見つかりません');
    expect(error.message).toContain('non-existent-proposal-12345');
  });
});