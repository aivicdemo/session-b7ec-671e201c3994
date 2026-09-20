import { findPlacementPlanByWorkerAndDate } from '../../src/logic/persistence-layer';

describe('SCEN-501: 指定した日付が配置計画の有効期間に含まれないときに、指定日付の配置計画が見つかりませんエラーが発生する', () => {
  it('targetDateが配置計画の開始日より前の場合、PlacementPlanNotFoundエラーをスローする', async () => {
    const workerId = 'WORKER-001';
    const requestingUserId = 'USER-ADMIN';
    const targetDate = new Date('2023-01-01');

    try {
      await findPlacementPlanByWorkerAndDate({
        workerId,
        targetDate,
        requestingUserId,
      });
      fail('期待されるエラーが発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('PlacementPlanNotFound');
      expect(error.message).toBe('指定日付の配置計画が見つかりません。');
    }
  });

  it('targetDateが配置計画の終了日より後の場合、PlacementPlanNotFoundエラーをスローする', async () => {
    const workerId = 'WORKER-001';
    const requestingUserId = 'USER-ADMIN';
    const targetDate = new Date('2025-12-31');

    try {
      await findPlacementPlanByWorkerAndDate({
        workerId,
        targetDate,
        requestingUserId,
      });
      fail('期待されるエラーが発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('PlacementPlanNotFound');
      expect(error.message).toBe('指定日付の配置計画が見つかりません。');
    }
  });
});