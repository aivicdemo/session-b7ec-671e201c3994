import { saveWorker, SaveWorkerInput } from '../../src/logic/data-persistence';

describe('SCEN-574: 作業者名が空値のとき InvalidWorkerDataError が発生する', () => {
  it('workerNameが空文字列の場合、InvalidWorkerDataErrorが発生し、戻り値が返されないこと', async () => {
    const invalidInput: SaveWorkerInput = {
      workerId: null,
      workerName: '',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッカー',
      operatingStatus: '稼働中',
      createdBy: 'USER001',
    };

    let exceptionThrown = false;
    let exceptionMessage = '';
    let exceptionName = '';

    try {
      await saveWorker(invalidInput);
    } catch (error: unknown) {
      exceptionThrown = true;
      if (error instanceof Error) {
        exceptionMessage = error.message;
        exceptionName = error.name;
      }
    }

    expect(exceptionThrown).toBe(true);
    expect(exceptionName).toBe('InvalidWorkerDataError');
    expect(exceptionMessage).toBe('作業者データの必須項目が不足または不正です。');
  });
});