import { notifyPlacementProposalRejection } from '../../src/logic/notification-and-integration';
import { NotifyPlacementProposalRejectionInput } from '../../src/logic/notification-and-integration';

describe('SCEN-823: notifyPlacementProposalRejection - InvalidRejectionReason error', () => {
  it('should throw InvalidRejectionReason error when rejectionReason is empty string', async () => {
    const input: NotifyPlacementProposalRejectionInput = {
      proposalId: 'PROP-001',
      rejectionReason: '' as any,
      rejectionReasonDetail: '詳細説明',
      nextActionInstruction: '別案の再提案',
      affectedWorkerIds: ['W001', 'W002'],
      relatedAnalysisId: 'ANALYSIS-001',
      notifyFieldLeaders: true,
      notifyAdministrators: true,
      deliveryChannels: ['EMAIL', 'APP_NOTIFICATION'],
      requestedBy: 'USER-123',
      priorityLevel: 'HIGH',
    };

    await expect(notifyPlacementProposalRejection(input)).rejects.toMatchObject({
      name: 'InvalidRejectionReason',
      message: '却下理由は必須であり、定義済みカテゴリから選択してください。',
    });
  });

  it('should throw InvalidRejectionReason error when rejectionReason is undefined category', async () => {
    const input: NotifyPlacementProposalRejectionInput = {
      proposalId: 'PROP-001',
      rejectionReason: 'UNDEFINED_CATEGORY' as any,
      rejectionReasonDetail: '詳細説明',
      nextActionInstruction: '別案の再提案',
      affectedWorkerIds: ['W001', 'W002'],
      relatedAnalysisId: 'ANALYSIS-001',
      notifyFieldLeaders: true,
      notifyAdministrators: true,
      deliveryChannels: ['EMAIL', 'APP_NOTIFICATION'],
      requestedBy: 'USER-123',
      priorityLevel: 'HIGH',
    };

    await expect(notifyPlacementProposalRejection(input)).rejects.toMatchObject({
      name: 'InvalidRejectionReason',
      message: '却下理由は必須であり、定義済みカテゴリから選択してください。',
    });
  });
});