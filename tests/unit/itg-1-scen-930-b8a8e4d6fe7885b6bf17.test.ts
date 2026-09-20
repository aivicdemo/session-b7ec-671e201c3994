import { saveProductivityData } from '../../src/logic/data-persistence';
import { SaveProductivityDataInput, SaveProductivityDataOutput } from '../../src/logic/data-persistence';

describe('SCEN-930: productivityDataIdがnull または undefinedの場合、新規作成として isNewRecord=true で保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('productivityDataIdが null の場合、新規作成として isNewRecord=true で保存される', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'work-result-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 95,
      productivityRate: 0.95,
      qualityScore: 0.92,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: 'Normal work completion',
      createdBy: 'user-001',
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.workResultId).toBe(input.workResultId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.workDate).toBe(input.workDate);
    expect(result.productivityRate).toBe(input.productivityRate);
    expect(result.qualityScore).toBe(input.qualityScore);
    expect(result.errorCount).toBe(input.errorCount);
    expect(result.proficiencyLevel).toBe(input.proficiencyLevel);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('productivityDataIdが undefined の場合、新規作成として isNewRecord=true で保存される', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: undefined,
      workResultId: 'work-result-002',
      workerId: 'worker-002',
      facilityId: 'facility-002',
      teamId: 'team-002',
      workDate: '2024-01-16',
      plannedWorkTime: 480,
      actualWorkTime: 480,
      completedItemCount: 100,
      productivityRate: 1.0,
      qualityScore: 0.98,
      errorCount: 0,
      proficiencyLevel: '上級',
      createdBy: 'user-002',
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
    expect(result.productivityDataId).not.toBeUndefined();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.workResultId).toBe(input.workResultId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.workDate).toBe(input.workDate);
    expect(result.productivityRate).toBe(input.productivityRate);
    expect(result.qualityScore).toBe(input.qualityScore);
    expect(result.errorCount).toBe(input.errorCount);
    expect(result.proficiencyLevel).toBe(input.proficiencyLevel);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('productivityDataIdが null で、生産性指標が範囲内の値の場合、正常に保存される', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'work-result-003',
      workerId: 'worker-003',
      facilityId: 'facility-003',
      teamId: 'team-003',
      workDate: '2024-01-17',
      plannedWorkTime: 400,
      actualWorkTime: 420,
      completedItemCount: 85,
      productivityRate: 0.85,
      qualityScore: 0.88,
      errorCount: 5,
      proficiencyLevel: '初級',
      remarks: 'Training period',
      createdBy: 'user-003',
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
    expect(result.productivityRate).toBe(0.85);
    expect(result.qualityScore).toBe(0.88);
    expect(result.errorCount).toBe(5);
    expect(result.savedAt).toBeDefined();
  });

  it('productivityDataIdが null で、生産性率が最小値 0.0 の場合、正常に保存される', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'work-result-004',
      workerId: 'worker-004',
      facilityId: 'facility-004',
      teamId: 'team-004',
      workDate: '2024-01-18',
      plannedWorkTime: 480,
      actualWorkTime: 0,
      completedItemCount: 0,
      productivityRate: 0.0,
      qualityScore: 0.0,
      errorCount: 0,
      proficiencyLevel: '初級',
      createdBy: 'user-004',
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
    expect(result.productivityRate).toBe(0.0);
    expect(result.qualityScore).toBe(0.0);
  });

  it('productivityDataIdが null で、生産性率が最大値 1.0 の場合、正常に保存される', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'work-result-005',
      workerId: 'worker-005',
      facilityId: 'facility-005',
      teamId: 'team-005',
      workDate: '2024-01-19',
      plannedWorkTime: 480,
      actualWorkTime: 480,
      completedItemCount: 120,
      productivityRate: 1.0,
      qualityScore: 1.0,
      errorCount: 0,
      proficiencyLevel: 'エキスパート',
      createdBy: 'user-005',
    };

    const result = await saveProductivityData(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.productivityDataId).not.toBeNull();
    expect(result.productivityRate).toBe(1.0);
    expect(result.qualityScore).toBe(1.0);
  });

  it('保存後、返却される savedAt は ISO 8601 形式の日時を含む', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'work-result-006',
      workerId: 'worker-006',
      facilityId: 'facility-006',
      teamId: 'team-006',
      workDate: '2024-01-20',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 90,
      productivityRate: 0.9,
      qualityScore: 0.85,
      errorCount: 3,
      proficiencyLevel: '中級',
      createdBy: 'user-006',
    };

    const beforeCall = new Date();
    const result = await saveProductivityData(input);
    const afterCall = new Date();

    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const savedDate = new Date(result.savedAt);
    expect(savedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
    expect(savedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});