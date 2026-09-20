import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-577: 職種が空値のとき InvalidWorkerDataError が発生する', () => {
  it('should throw InvalidWorkerDataError when jobType is empty string', async () => {
    const input = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: '',
      operatingStatus: '稼働中',
      createdBy: 'USER001',
    };

    await expect(saveWorker(input)).rejects.toMatchObject({
      name: 'InvalidWorkerDataError',
      message: expect.stringContaining('作業者データの必須項目が不足または不正です'),
    });
  });
});