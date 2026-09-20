import { saveWorker } from '../../src/logic/persistence-layer';

describe('SCEN-430: 作業者データ保存エラーハンドリング', () => {
  it('必須項目が欠落した入力で、作業者データが不正であるエラーを返す', async () => {
    const invalidInput = {
      workerId: 'W001',
      workerName: '',
      siteId: 'S001',
      teamId: 'T001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdBy: 'U001',
      requestingUserId: 'U001',
    };

    await expect(saveWorker(invalidInput)).rejects.toThrow(
      '作業者データが不正です。必須項目を確認してください。'
    );
  });
});