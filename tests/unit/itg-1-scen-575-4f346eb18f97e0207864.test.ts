import { saveWorker, SaveWorkerInput } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-575: 拠点IDが空値のとき InvalidWorkerDataError が発生する', () => {
    it('saveWorker に facilityId が空文字列の場合、InvalidWorkerDataError が発生する', async () => {
      const input: SaveWorkerInput = {
        workerId: undefined,
        workerName: '田中太郎',
        facilityId: '',
        teamId: 'team-123',
        jobType: '組立',
        operatingStatus: 'active',
        createdBy: 'user-001',
      };

      await expect(saveWorker(input)).rejects.toThrow('InvalidWorkerDataError');
      await expect(saveWorker(input)).rejects.toThrow(
        '作業者データの必須項目が不足または不正です。'
      );
    });
  });
});