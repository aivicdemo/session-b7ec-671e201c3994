import { saveProductivityData } from '../../src/logic/data-persistence';

describe('SCEN-937: saveProductivityData - ReferentialIntegrityViolation on non-existent workerId', () => {
  it('should throw ReferentialIntegrityViolation when workerId does not exist in database', async () => {
    // Step 1: 入力値を構成
    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'WR-001',
      workerId: 'WORKER-999',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null as string | null | undefined,
      createdBy: 'ADMIN-001',
      updatedBy: null as string | null | undefined,
    };

    // Step 2: 入力値の必須フィールドがすべて存在し、形式が正当であることを確認
    expect(input.workResultId).toBeDefined();
    expect(typeof input.workResultId).toBe('string');
    expect(input.workerId).toBeDefined();
    expect(typeof input.workerId).toBe('string');
    expect(input.facilityId).toBeDefined();
    expect(typeof input.facilityId).toBe('string');
    expect(input.teamId).toBeDefined();
    expect(typeof input.teamId).toBe('string');
    expect(input.workDate).toBeDefined();
    expect(typeof input.workDate).toBe('string');

    // Step 3 & 4: saveProductivityData 関数を実行して ReferentialIntegrityViolation エラーが発生することを確認
    // 実装内で workerId の参照整合性チェックが行われ、WORKER-999 が存在しないため例外が発生
    await expect(saveProductivityData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'ReferentialIntegrityViolation',
        message: expect.stringContaining('参照先の作業実績、作業者、拠点、チームが見つかりません。'),
      })
    );
  });
});