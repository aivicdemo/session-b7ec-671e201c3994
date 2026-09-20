import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';

describe('SCEN-809: notifyPerformanceDataSaved error handling', () => {
  it('should throw InvalidPerformanceDataInput error when performanceRecordId is empty string', async () => {
    const input = {
      performanceRecordId: '',
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-456',
      teamId: 'team-789',
      departmentId: 'dept-012',
      workDate: '2024-01-15T09:00:00Z',
      completedQuantity: 100,
      workTypeId: 'worktype-345',
      qualityScore: 95,
      savedAt: '2024-01-15T10:30:00Z',
      requestedBy: 'user-678',
    };

    try {
      await notifyPerformanceDataSaved(input);
      fail('Expected InvalidPerformanceDataInput error to be thrown');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.name).toBe('InvalidPerformanceDataInput');
        expect(error.message).toContain('実績データIDが無効です。');
      } else {
        fail('Error is not an instance of Error');
      }
    }
  });
});