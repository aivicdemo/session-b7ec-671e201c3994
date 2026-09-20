import { findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-470: 指定された作業者と期間に該当する生産性レコードが存在しない場合、NoProductivityDataFoundErrorが発生する', () => {
  it('should throw NoProductivityDataFoundErrorが発生し、エラー文言として「指定された期間の生産性データが見つかりません。」が返される', async () => {
    const workerId = 'worker-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';

    const input = {
      workerId,
      startDate,
      endDate,
      requestingUserId,
    };

    await expect(
      findProductivityDataByWorkerAndPeriod(input)
    ).rejects.toThrow('指定された期間の生産性データが見つかりません。');
  });
});