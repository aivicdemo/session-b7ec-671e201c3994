import { saveProductivityData } from '../../src/logic/data-persistence';

describe('SCEN-948: 生産性データの保存と savedAt フィールド検証', () => {
  it('新規作成時に savedAt が現在の ISO 8601形式の日時を示す', async () => {
    // Setup
    const beforeSave = new Date();
    
    const input = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      workDate: '2025-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 120,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'U-001',
      updatedBy: null,
    };

    // Execute
    const result = await saveProductivityData(input);
    
    const afterSave = new Date();

    // Verify
    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).toBeDefined();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.productivityDataId.length).toBeGreaterThan(0);
    
    // savedAt is ISO 8601 format
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // savedAt is within the save operation timeframe
    const savedAtTime = new Date(result.savedAt);
    expect(savedAtTime.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    expect(savedAtTime.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    
    // Output fields match input values
    expect(result.workResultId).toBe(input.workResultId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.productivityRate).toBe(input.productivityRate);
    expect(result.qualityScore).toBe(input.qualityScore);
    expect(result.errorCount).toBe(input.errorCount);
    expect(result.proficiencyLevel).toBe(input.proficiencyLevel);
  });
});