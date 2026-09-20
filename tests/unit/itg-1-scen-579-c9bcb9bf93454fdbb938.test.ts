import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-579: 作業者名が不正な形式のとき InvalidWorkerDataError が発生する', () => {
  it('should throw InvalidWorkerDataError when workerName is empty string', async () => {
    const input = {
      workerId: null,
      workerName: '',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: '作業者',
      operatingStatus: '稼働中',
      createdBy: 'USER001',
    };

    await expect(saveWorker(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerDataError',
        message: '作業者データの必須項目が不足または不正です。',
      })
    );
  });
});