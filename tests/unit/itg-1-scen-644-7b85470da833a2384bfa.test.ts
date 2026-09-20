import { saveProficiency } from '../../src/logic/data-persistence';
import { SaveProficiencyInput, SaveProficiencyOutput } from '../../src/logic/data-persistence';

describe('SCEN-644: saveProficiency - updatedByが指定されていない場合でも処理が完了する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updatedByがnull/未指定の状態で新規習熟度データが正常に保存される', async () => {
    const mockInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
      updatedBy: null,
    };

    let errorOccurred = false;
    let result: SaveProficiencyOutput | undefined;

    try {
      result = await saveProficiency(mockInput);
    } catch (error) {
      errorOccurred = true;
    }

    expect(errorOccurred).toBe(false);
    expect(result).toBeDefined();
    expect(result!.proficiencyId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result!.workerId).toBe('W001');
    expect(result!.jobType).toBe('ピッキング');
    expect(result!.proficiencyLevel).toBe('中級');
    expect(result!.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result!.isNewRecord).toBe(true);
  });
});