import { notifyPlacementProposalRejection } from '../../src/logic/notification-and-integration';

describe('SCEN-833: affectedWorkerIdsが空配列のとき、却下通知が正常に処理される', () => {
  it('should process rejection notification successfully when affectedWorkerIds is empty array', async () => {
    const input = {
      proposalId: 'PROP-001',
      rejectionReason: 'BUSINESS_CONSTRAINT' as const,
      rejectionReasonDetail: '予算制約により実施不可',
      nextActionInstruction: '条件改善後に再検討',
      affectedWorkerIds: [],
      relatedAnalysisId: null,
      notifyFieldLeaders: true,
      notifyAdministrators: true,
      deliveryChannels: ['EMAIL', 'SYSTEM_MESSAGE'] as const[],
      requestedBy: 'USER-ADMIN-001',
      priorityLevel: 'MEDIUM' as const,
    };

    const result = await notifyPlacementProposalRejection(input);

    expect(result.success).toBe(true);
    expect(result.proposalId).toBe('PROP-001');
    expect(result.rejectionTrackingId).toBeTruthy();
    expect(result.allocationChangeHistoryId).toBe('HIST-789');
    expect(result.notificationTrackingIds.administratorNotificationId).toBe('NOTIF-ADM-001');
    expect(result.notificationTrackingIds.fieldLeaderNotificationIds).toHaveLength(2);
    expect(result.auditLogId).toBe('AUDIT-001');
    expect(result.rejectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.notificationDeliveryStatus.administratorDelivered).toBe(true);
    expect(result.notificationDeliveryStatus.fieldLeadersDelivered).toBe(2);
    expect(result.notificationDeliveryStatus.fieldLeadersFailed).toBe(0);
    expect(result.notificationDeliveryStatus.deliveryChannelsUsed).toContain('EMAIL');
    expect(result.notificationDeliveryStatus.deliveryChannelsUsed).toContain('SYSTEM_MESSAGE');
    expect(result.partialFailures).toBeNull();
  });
});