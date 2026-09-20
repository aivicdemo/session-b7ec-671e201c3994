import { saveProficiency } from '../../src/logic/data-persistence';
import type { SaveProficiencyInput, SaveProficiencyOutput } from '../../src/logic/data-persistence';

describe('SCEN-643: remarksが指定されていない場合でも処理が完了する', () => {
  it('should complete successfully when remarks is null and return valid SaveProficiencyOutput', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
      updatedBy: undefined,
    };

    const result = await saveProficiency(testInput);

    expect(result).toBeDefined();
    expect(typeof result.proficiencyId).toBe('string');
    expect(result.proficiencyId.length).toBeGreaterThan(0);
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('梱包');
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(result.isNewRecord).toBe(true);
  });

  it('should complete successfully when remarks is undefined and return valid SaveProficiencyOutput', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: undefined,
      createdBy: 'C001',
      updatedBy: undefined,
    };

    const result = await saveProficiency(testInput);

    expect(result).toBeDefined();
    expect(typeof result.proficiencyId).toBe('string');
    expect(result.proficiencyId.length).toBeGreaterThan(0);
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('梱包');
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(result.isNewRecord).toBe(true);
  });

  it('should not throw validation error when remarks is null', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    await expect(saveProficiency(testInput)).resolves.toBeDefined();
  });

  it('should not throw validation error when remarks is undefined', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: undefined,
      createdBy: 'C001',
    };

    await expect(saveProficiency(testInput)).resolves.toBeDefined();
  });

  it('should return ISO 8601 formatted savedAt timestamp', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it('should indicate new record creation with isNewRecord true', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result.isNewRecord).toBe(true);
  });

  it('should return SaveProficiencyOutput with all required fields when remarks is null', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result).toHaveProperty('proficiencyId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('jobType');
    expect(result).toHaveProperty('proficiencyLevel');
    expect(result).toHaveProperty('savedAt');
    expect(result).toHaveProperty('isNewRecord');
  });

  it('should store workerId W001 correctly in response', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result.workerId).toBe('W001');
  });

  it('should store jobType 梱包 correctly in response', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result.jobType).toBe('梱包');
  });

  it('should store proficiencyLevel 中級 correctly in response', async () => {
    const testInput: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
    };

    const result = await saveProficiency(testInput);

    expect(result.proficiencyLevel).toBe('中級');
  });
});