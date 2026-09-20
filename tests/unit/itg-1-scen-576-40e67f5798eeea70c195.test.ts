import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-576: 作業者マスタデータの新規作成時にチームIDが空値のとき InvalidWorkerDataError が発生する', () => {
  it('チームIDが空値のとき InvalidWorkerDataError が発生する', async () => {
    const input = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC001',
      teamId: '',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdBy: 'USR001',
    };

    await expect(saveWorker(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerDataError',
        message: '作業者データの必須項目が不足または不正です。',
      })
    );
  });
});