import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-770: sendNotificationToAdministrator', () => {
  describe('sentAtに正しいISO 8601形式の日時が記録される', () => {
    it('should return sentAt in valid ISO 8601 format', async () => {
      const input = {
        administratorId: 'admin001',
        notificationTitle: '遅延リスク警告',
        notificationContent: '作業者A の作業進捗が予定より遅延しています',
        priorityLevel: 'HIGH' as const,
        notificationType: 'DELAY_RISK_ALERT',
        relatedEntityId: 'worker-123',
        actionUrl: '/placements/plan-456',
        requestedBy: 'system-auto',
      };

      const result = await sendNotificationToAdministrator(input);

      expect(result.sentAt).toBeDefined();

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+\-]\d{2}:\d{2})$/;
      expect(result.sentAt).toMatch(iso8601Regex);

      const parsedDate = new Date(result.sentAt);
      expect(parsedDate instanceof Date && !isNaN(parsedDate.getTime())).toBe(true);

      const invalidFormats = [
        '2024/01/15 14:30:45',
        'Jan 15, 2024 2:30 PM',
        '2024-01-15 14:30:45',
        '15-01-2024T14:30:45Z',
      ];

      invalidFormats.forEach((invalidFormat) => {
        expect(result.sentAt).not.toBe(invalidFormat);
      });
    });
  });
});