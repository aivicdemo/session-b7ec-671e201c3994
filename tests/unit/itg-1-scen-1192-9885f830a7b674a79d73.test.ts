import { jest } from '@jest/globals';
import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';

// Mock the internal dependencies
jest.mock('../../src/logic/db', () => ({
  getDelayRiskJudgmentById: jest.fn(),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
  recordWorkInstructionDeliveryHistory: jest.fn(),
}));

jest.mock('../../src/logic/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/adapters/notification-service-adapter', () => ({
  NotificationServiceAdapter: jest.fn().mockImplementation(() => ({
    sendDelayRiskAlert: jest.fn(),
  })),
}));

jest.mock('../../src/adapters/wms-handy-terminal-datasource', () => ({
  WmsHandyTerminalDataSource: jest.fn(),
}));

import * as db from '../../src/logic/db';
import * as auth from '../../src/logic/authorization';
import { NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('SCEN-1192: 一部のチャネルでのみ配信に成功した場合', () => {
  let mockNotificationAdapter: jest.Mocked<InstanceType<typeof NotificationServiceAdapter>>;
  let recordDeliveryHistoryCallCount: number;

  beforeEach(() => {
    jest.clearAllMocks();
    recordDeliveryHistoryCallCount = 0;

    // Setup default mocks for database
    (db.getDelayRiskJudgmentById as jest.Mock).mockResolvedValue({
      リスク判定結果ID: 'risk-001',
      作業指示ID: 'work-001',
      拠点ID: 'facility-A',
      チームID: null,
      判定日時: new Date(),
      リスクレベル: '高',
      進捗率: 50,
      計画進捗率: 70,
    });

    (db.getFacilityById as jest.Mock).mockResolvedValue({
      拠点ID: 'facility-A',
      拠点名: 'Facility A',
      拠点コード: 'FAC-001',
      住所: 'Test Address',
      最大収容人員数: 100,
      現在配置人員数: 50,
      稼働状況: '稼働中',
      責任者名: 'Manager A',
      連絡先: '090-0000-0000',
      作成日時: new Date(),
      更新日時: new Date(),
      作成者: 'admin',
      更新者: 'admin',
    });

    (db.getTeamById as jest.Mock).mockResolvedValue(null);

    // Track multiple calls to recordWorkInstructionDeliveryHistory
    (db.recordWorkInstructionDeliveryHistory as jest.Mock).mockImplementation(() => {
      recordDeliveryHistoryCallCount++;
      return Promise.resolve(`history-${recordDeliveryHistoryCallCount.toString().padStart(3, '0')}`);
    });

    (auth.authorizeOperation as jest.Mock).mockResolvedValue(true);

    // Setup notification service adapter mock
    mockNotificationAdapter = new NotificationServiceAdapter() as jest.Mocked<
      InstanceType<typeof NotificationServiceAdapter>
    >;
    
    (mockNotificationAdapter.sendDelayRiskAlert as jest.Mock).mockImplementation(
      (channels: string[], _payload: unknown) => {
        const results: Record<string, { success: boolean; deliveryId?: string; error?: string }> = {};
        
        channels.forEach((channel) => {
          if (channel === 'email') {
            results[channel] = {
              success: true,
              deliveryId: 'deliv-email-001',
            };
          } else if (channel === 'app_notification') {
            results[channel] = {
              success: false,
              error: 'App notification service unavailable',
            };
          } else if (channel === 'handy_terminal') {
            results[channel] = {
              success: false,
              error: 'Handy terminal connection failed',
            };
          }
        });
        
        return Promise.resolve(results);
      }
    );
  });

  it('一部のチャネルでのみ配信に成功した場合、successはtrueで成功したチャネルのみdeliveredChannelsに含まれる', async () => {
    const now = new Date();
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-A',
      teamId: null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: 'Add 2 workers',
          targetWorkInstructionIds: ['work-001'],
          recommendedActionDetails: 'Assign additional staff to reduce delay',
        },
      ],
      deliveryChannels: ['email', 'app_notification', 'handy_terminal'] as const,
      priority: 'high' as const,
      requestedByUserId: 'user-123',
      requestedAt: now,
    };

    const result = await deliverImprovementInstructionToFacility(input);

    // Assertion: success should be true for partial success
    expect(result.success).toBe(true);

    // Assertion: deliveredChannels should only contain 'email'
    expect(result.deliveredChannels).toEqual(['email']);
    expect(result.deliveredChannels).not.toContain('app_notification');
    expect(result.deliveredChannels).not.toContain('handy_terminal');

    // Assertion: metadata matches input
    expect(result.delayRiskJudgmentId).toBe('risk-001');
    expect(result.facilityId).toBe('facility-A');
    expect(result.teamId).toBeNull();

    // Assertion: delivery history IDs are recorded
    expect(result.deliveryHistoryIds).toBeDefined();
    expect(Array.isArray(result.deliveryHistoryIds)).toBe(true);
    expect(result.deliveryHistoryIds.length).toBeGreaterThan(0);

    // Assertion: failureReason documents the failures
    expect(result.failureReason).not.toBeNull();
    expect(typeof result.failureReason).toBe('string');
    expect(result.failureReason).toMatch(/app_notification|handy_terminal/i);

    // Assertion: fieldLeaderDeliveryStatus contains delivery details
    expect(result.fieldLeaderDeliveryStatus).toBeDefined();
    expect(Array.isArray(result.fieldLeaderDeliveryStatus)).toBe(true);

    // Assertion: email delivery succeeded
    const emailStatus = result.fieldLeaderDeliveryStatus.find((s) => s.channel === 'email');
    expect(emailStatus).toBeDefined();
    expect(emailStatus?.status).toBe('success');
    expect(emailStatus?.userId).toBeDefined();
    expect(typeof emailStatus?.userId).toBe('string');
    expect(emailStatus?.deliveredAt).toBeInstanceOf(Date);

    // Assertion: app_notification delivery failed
    const appNotificationStatus = result.fieldLeaderDeliveryStatus.find(
      (s) => s.channel === 'app_notification'
    );
    expect(appNotificationStatus).toBeDefined();
    expect(appNotificationStatus?.status).toBe('failed');
    expect(appNotificationStatus?.userId).toBeDefined();
    expect(typeof appNotificationStatus?.userId).toBe('string');

    // Assertion: handy_terminal delivery failed
    const handyTerminalStatus = result.fieldLeaderDeliveryStatus.find(
      (s) => s.channel === 'handy_terminal'
    );
    expect(handyTerminalStatus).toBeDefined();
    expect(handyTerminalStatus?.status).toBe('failed');
    expect(handyTerminalStatus?.userId).toBeDefined();
    expect(typeof handyTerminalStatus?.userId).toBe('string');

    // Assertion: Verify partial success semantics
    const successCount = result.fieldLeaderDeliveryStatus.filter((s) => s.status === 'success').length;
    const failureCount = result.fieldLeaderDeliveryStatus.filter((s) => s.status === 'failed').length;
    expect(successCount).toBeGreaterThan(0);
    expect(failureCount).toBeGreaterThan(0);
  });
});