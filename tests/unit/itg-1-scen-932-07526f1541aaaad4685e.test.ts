import { saveProductivityData } from '../../src/logic/data-persistence';

describe('SCEN-932: Save productivity data with optional remarks field', () => {
  it('should successfully save new productivity data when remarks is null or undefined', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: undefined,
    };

    const result = await saveProductivityData(input);

    expect(result).toBeDefined();
    expect(result.productivityDataId).toBeDefined();
    expect(result.productivityDataId).not.toBeNull();
    expect(result.workResultId).toBe('WR-001');
    expect(result.workerId).toBe('W-001');
    expect(result.facilityId).toBe('F-001');
    expect(result.teamId).toBe('T-001');
    expect(result.workDate).toBe('2024-01-15');
    expect(result.productivityRate).toBe(0.9375);
    expect(result.qualityScore).toBe(0.95);
    expect(result.errorCount).toBe(2);
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.isNewRecord).toBe(true);
    expect(result.savedAt).toBeDefined();

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(result.savedAt)).toBe(true);
  });

  it('should save productivity data without throwing error when remarks is undefined', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'WR-002',
      workerId: 'W-002',
      facilityId: 'F-002',
      teamId: 'T-002',
      workDate: '2024-01-16',
      plannedWorkTime: 480,
      actualWorkTime: 460,
      completedItemCount: 95,
      productivityRate: 0.9583,
      qualityScore: 0.93,
      errorCount: 3,
      proficiencyLevel: '上級',
      createdBy: 'USR-002',
    };

    await expect(saveProductivityData(input)).resolves.toBeDefined();
  });

  it('should save productivity data and return isNewRecord as true for new records', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'WR-003',
      workerId: 'W-003',
      facilityId: 'F-003',
      teamId: 'T-003',
      workDate: '2024-01-17',
      plannedWorkTime: 500,
      actualWorkTime: 500,
      completedItemCount: 110,
      productivityRate: 1.0,
      qualityScore: 0.98,
      errorCount: 1,
      proficiencyLevel: '初級',
      remarks: null,
      createdBy: 'USR-003',
      updatedBy: undefined,
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
  });

  it('should handle all required fields correctly despite remarks being null', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'WR-004',
      workerId: 'W-004',
      facilityId: 'F-004',
      teamId: 'T-004',
      workDate: '2024-01-18',
      plannedWorkTime: 420,
      actualWorkTime: 400,
      completedItemCount: 85,
      productivityRate: 0.8571,
      qualityScore: 0.92,
      errorCount: 4,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'USR-004',
    };

    const result = await saveProductivityData(input);

    expect(result.workResultId).toBe(input.workResultId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.workDate).toBe(input.workDate);
    expect(result.productivityRate).toBe(input.productivityRate);
    expect(result.qualityScore).toBe(input.qualityScore);
    expect(result.errorCount).toBe(input.errorCount);
    expect(result.proficiencyLevel).toBe(input.proficiencyLevel);
    expect(result.isNewRecord).toBe(true);
  });
});