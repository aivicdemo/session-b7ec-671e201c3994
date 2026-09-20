import { getWorkerById } from '../../src/logic/data-persistence';

describe('SCEN-593: 作業者マスタ検索機能', () => {
  it('指定された作業者IDで作業者マスタを正常に検索して、作業者データを返す', async () => {
    // Arrange
    const workerId = 'WORKER-001';
    const input = { workerId };

    // Act
    const result = await getWorkerById(input);

    // Assert
    // 返されたオブジェクトがGetWorkerByIdOutput型で、null以外であることを確認
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 作業者の基本情報を確認
    expect(result.workerId).toBe(workerId);
    expect(result.workerName).toBeDefined();
    expect(typeof result.workerName).toBe('string');
    expect(result.workerName.length).toBeGreaterThan(0);

    // 所属情報を確認
    expect(result.facilityId).toBeDefined();
    expect(typeof result.facilityId).toBe('string');
    expect(result.facilityId.length).toBeGreaterThan(0);

    expect(result.teamId).toBeDefined();
    expect(typeof result.teamId).toBe('string');
    expect(result.teamId.length).toBeGreaterThan(0);

    // スキル情報を確認
    expect(result.jobType).toBeDefined();
    expect(typeof result.jobType).toBe('string');
    expect(result.jobType.length).toBeGreaterThan(0);

    // 稼働状況を確認
    expect(result.operatingStatus).toBeDefined();
    expect(typeof result.operatingStatus).toBe('string');
    expect(['active', 'inactive', 'maintenance'].includes(result.operatingStatus) || result.operatingStatus.length > 0).toBe(true);

    // 日時情報を確認
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');

    // ユーザーID情報を確認
    expect(result.createdBy).toBeDefined();
    expect(typeof result.createdBy).toBe('string');
  });
});