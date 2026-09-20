import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-592: 保存日時が ISO 8601 形式で返される', () => {
  it('saveWorker処理で新規作成時、savedAtがISO 8601形式で返されること', async () => {
    // Arrange
    const input = {
      workerId: null,
      workerName: '田中太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    // Act
    const result = await saveWorker(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.savedAt).toBeDefined();
    
    // ISO 8601 形式の検証
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.savedAt).toMatch(iso8601Pattern);
    
    // 日付として妥当性を確認
    const parsedDate = new Date(result.savedAt);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getTime()).not.toBeNaN();
  });
});