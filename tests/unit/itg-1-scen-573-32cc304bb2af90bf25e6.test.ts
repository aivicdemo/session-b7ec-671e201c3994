import { saveWorker } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 既存workerId指定の更新で isNewRecord が false として返される', () => {
  it('既存の作業者レコードを更新する場合、isNewRecord が false を返すこと', async () => {
    // 既存の作業者ID
    const existingWorkerId = 'WKR-001';
    
    // SaveWorkerInput: 既存IDを指定して更新
    const input = {
      workerId: existingWorkerId,
      workerName: '山田太郎',
      facilityId: 'FAC-10',
      teamId: 'TM-05',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1200,
      maxWorkingHours: 8,
      createdBy: 'USR-00001',
      updatedBy: 'USR-00002'
    };

    // saveWorker関数を呼び出す
    const output = await saveWorker(input);

    // isNewRecord が false であることを検証
    expect(output.isNewRecord).toBe(false);
    
    // その他の出力フィールドを検証
    expect(output.workerId).toBe('WKR-001');
    expect(output.workerName).toBe('山田太郎');
    expect(output.facilityId).toBe('FAC-10');
    expect(output.teamId).toBe('TM-05');
    
    // savedAt が ISO 8601 形式の文字列であることを確認
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});