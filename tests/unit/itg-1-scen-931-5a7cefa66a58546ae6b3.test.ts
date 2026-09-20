import { saveProductivityData } from '../../src/logic/data-persistence';
import type { SaveProductivityDataInput, SaveProductivityDataOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-931: productivityDataIdに値を指定した場合、更新として isNewRecord=false で保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // validateNumericQuantity をスタブ化
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockImplementation((value: number, min: number, max: number) => {
      return value >= min && value <= max;
    });

    // validateReferentialIntegrity をスタブ化
    jest.spyOn(dataPersistence, 'validateReferentialIntegrity' as any).mockImplementation((ids: string[]) => {
      return ids.every(id => id && id.length > 0);
    });

    // validateDateTimeRange をスタブ化
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockImplementation((dateString: string) => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(dateString);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save productivity data as an update with isNewRecord=false when productivityDataId is provided', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: 'prod-data-001',
      workResultId: 'work-result-123',
      workerId: 'worker-456',
      facilityId: 'facility-789',
      teamId: 'team-012',
      workDate: '2025-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'user-111',
      updatedBy: 'user-222',
    };

    // 実行：saveProductivityData を呼び出す
    const result = await saveProductivityData(input);

    // 検証：期待結果の確認
    expect(result).toBeDefined();
    expect(result.productivityDataId).toBe('prod-data-001');
    expect(result.workResultId).toBe('work-result-123');
    expect(result.workerId).toBe('worker-456');
    expect(result.facilityId).toBe('facility-789');
    expect(result.teamId).toBe('team-012');
    expect(result.workDate).toBe('2025-01-15');
    
    // productivityRate、qualityScore、errorCount の値が正当であることを検証
    expect(result.productivityRate).toBe(0.9);
    expect(result.productivityRate).toBeGreaterThanOrEqual(0);
    expect(result.productivityRate).toBeLessThanOrEqual(1);
    
    expect(result.qualityScore).toBe(0.95);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(1);
    
    expect(result.errorCount).toBe(2);
    expect(result.errorCount).toBeGreaterThanOrEqual(0);
    
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // workResultId、workerId、facilityId、teamId のすべてが存在することを検証
    expect(result.workResultId).toBeTruthy();
    expect(result.workerId).toBeTruthy();
    expect(result.facilityId).toBeTruthy();
    expect(result.teamId).toBeTruthy();

    // 主要検証：productivityDataId が指定された場合、isNewRecord は false である
    expect(result.isNewRecord).toBe(false);
  });
});