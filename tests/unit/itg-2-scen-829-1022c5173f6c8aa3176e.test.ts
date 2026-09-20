import { notifyPlacementProposalRejection } from '../../src/logic/notification-and-integration';

describe('SCEN-829: notifyPlacementProposalRejection with notifyFieldLeaders=false', () => {
  it('should not send notifications to field leaders when notifyFieldLeaders is false', async () => {
    const input = {
      proposalId: 'PROP-001',
      rejectionReason: 'BUSINESS_CONSTRAINT' as const,
      rejectionReasonDetail: '予算削減方針に合致しない',
      nextActionInstruction: '代替案を3営業日以内に提案すること',
      affectedWorkerIds: ['WORKER-001', 'WORKER-002'],
      relatedAnalysisId: 'ANALYSIS-123',
      notifyFieldLeaders: false,
      notifyAdministrators: true,
      deliveryChannels: ['EMAIL', 'SYSTEM_MESSAGE'] as const[],
      requestedBy: 'USER-ADMIN-001',
      priorityLevel: 'HIGH' as const,
    };

    const result = await notifyPlacementProposalRejection(input);

    expect(result.success).toBe(true);
    expect(result.notificationTrackingIds.fieldLeaderNotificationIds).toEqual([]);
    expect(result.notificationTrackingIds.administratorNotificationId).toBeDefined();
    expect(typeof result.notificationTrackingIds.administratorNotificationId).toBe('string');
    expect(result.notificationTrackingIds.administratorNotificationId.length).toBeGreaterThan(0);
    expect(result.notificationDeliveryStatus.fieldLeadersDelivered).toBe(0);
    expect(result.notificationDeliveryStatus.fieldLeadersFailed).toBe(0);
    expect(result.notificationDeliveryStatus.administratorDelivered).toBe(true);
    expect(result.rejectedAt).toBeDefined();
    expect(result.allocationChangeHistoryId).toBeDefined();
    expect(result.allocationChangeHistoryId.length).toBeGreaterThan(0);
    expect(result.auditLogId).toBeDefined();
    expect(result.auditLogId.length).toBeGreaterThan(0);
    expect(result.partialFailures).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});