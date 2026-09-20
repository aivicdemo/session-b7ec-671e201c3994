import { saveWorker, SaveWorkerInput, SaveWorkerOutput } from '../../src/logic/persistence-layer';

describe('SCEN-429: 代表的な正常入力で新規作業者を作成し、成功応答と作成日時を返す', () => {
  it('should create a new worker and return success response with creation timestamp', async () => {
    // Arrange
    const input: SaveWorkerInput = {
      workerId: 'W-20250115-001',
      workerName: '山田太郎',
      siteId: 'SITE-A01',
      teamId: 'TEAM-P01',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1200,
      maxOperatingHours: 8,
      createdBy: 'USER-ADMIN',
      requestingUserId: 'USER-ADMIN',
    };

    const beforeExecution = new Date();

    // Act
    const result = await saveWorker(input);

    const afterExecution = new Date();

    // Assert
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('W-20250115-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 5000);
    
    if (result.message) {
      expect(result.message).toMatch(/作成|新規|作業者/);
    }
  });
});