import { saveProductivityData } from '../../src/logic/data-persistence';
import { SaveProductivityDataInput, SaveProductivityDataOutput } from '../../src/logic/data-persistence';

describe('SCEN-947: 生産性データの新規作成時に productivityDataId が返される', () => {
  it('新規作成時、入力された生産性データから新たに生成された productivityDataId が返される', async () => {
    // Arrange: テスト入力値を設定
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 120,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    // Act: saveProductivityData を呼び出し
    const output: SaveProductivityDataOutput = await saveProductivityData(input);

    // Assert: 出力フィールドを検証

    // (1) 新たに生成された productivityDataId が存在することを確認
    expect(output.productivityDataId).toBeDefined();
    expect(output.productivityDataId).not.toBeNull();
    expect(typeof output.productivityDataId).toBe('string');
    expect(output.productivityDataId.length).toBeGreaterThan(0);

    // (2) 入力値と一致するフィールドを確認
    expect(output.workResultId).toBe(input.workResultId);
    expect(output.workerId).toBe(input.workerId);
    expect(output.facilityId).toBe(input.facilityId);
    expect(output.teamId).toBe(input.teamId);
    expect(output.workDate).toBe(input.workDate);
    expect(output.productivityRate).toBe(input.productivityRate);
    expect(output.qualityScore).toBe(input.qualityScore);
    expect(output.errorCount).toBe(input.errorCount);
    expect(output.proficiencyLevel).toBe(input.proficiencyLevel);

    // (3) savedAt が ISO 8601 形式の現在日時であることを確認
    expect(output.savedAt).toBeDefined();
    expect(typeof output.savedAt).toBe('string');
    const savedAtDate = new Date(output.savedAt);
    expect(savedAtDate).toBeInstanceOf(Date);
    expect(isNaN(savedAtDate.getTime())).toBe(false);
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(output.savedAt).toMatch(iso8601Regex);

    // (4) isNewRecord が true であることを確認
    expect(output.isNewRecord).toBe(true);
  });
});