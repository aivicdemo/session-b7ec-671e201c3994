import { saveProficiency } from '../../src/logic/data-persistence';

describe('SCEN-631: 作業者習熟度データの新規作成時に出力が正しい形式で含まれることを検証', () => {
  it('should include savedAt field in ISO 8601 format when creating a new proficiency record', async () => {
    // Arrange: テストデータの準備
    const input = {
      proficiencyId: null as string | null | undefined,
      workerId: 'W001',
      jobType: '仕分け',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null as string | null | undefined,
      createdBy: 'C001',
      updatedBy: undefined as string | null | undefined,
    };

    // Act: saveProficiency を実行
    const output = await saveProficiency(input);

    // Assert: 出力型 SaveProficiencyOutput の各フィールドを検証
    // proficiencyId が生成されたことを確認
    expect(output.proficiencyId).toBeDefined();
    expect(typeof output.proficiencyId).toBe('string');
    expect(output.proficiencyId).not.toBeNull();

    // workerId, jobType, proficiencyLevel が入力値と一致
    expect(output.workerId).toBe('W001');
    expect(output.jobType).toBe('仕分け');
    expect(output.proficiencyLevel).toBe('中級');

    // isNewRecord が true（新規作成）
    expect(output.isNewRecord).toBe(true);

    // savedAt が ISO 8601 形式であることを検証
    expect(output.savedAt).toBeDefined();
    expect(typeof output.savedAt).toBe('string');
    // ISO 8601 形式のパターンマッチ
    // 対応する形式: 'YYYY-MM-DDTHH:mm:ss.sssZ' または 'YYYY-MM-DDTHH:mm:ss+HH:mm' など
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(output.savedAt).toMatch(iso8601Pattern);

    // savedAt が有効な日時文字列であることを追加検証
    const parsedDate = new Date(output.savedAt);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getTime()).not.toBeNaN();
  });
});