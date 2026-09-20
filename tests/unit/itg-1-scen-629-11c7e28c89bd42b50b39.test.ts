import {
  saveProficiency,
  SaveProficiencyInput,
  SaveProficiencyOutput,
  getProficiencyById,
  GetProficiencyByIdInput,
  getWorkerById,
  GetWorkerByIdInput,
} from '../../src/logic/data-persistence';

describe('SCEN-629: 新規作成時に必須フィールドが揃った習熟度データを保存すると、新規レコードとして永続化され習熟度IDが採番される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new proficiency record with auto-generated ID and return SaveProficiencyOutput with isNewRecord=true', async () => {
    const input: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'WKR-001',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'MGR-001',
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: undefined,
    };

    const beforeTime = new Date();
    const result: SaveProficiencyOutput = await saveProficiency(input);
    const afterTime = new Date();

    expect(result).toBeDefined();
    expect(result.proficiencyId).toBeDefined();
    expect(result.proficiencyId).not.toBeNull();
    expect(result.proficiencyId).toBeTruthy();
    expect(typeof result.proficiencyId).toBe('string');
    expect(result.workerId).toBe('WKR-001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.savedAt).toBeDefined();
    expect(result.isNewRecord).toBe(true);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.savedAt).toMatch(iso8601Regex);

    const savedTime = new Date(result.savedAt);
    expect(savedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(savedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
  });

  it('should persist the proficiency record to database and make it retrievable by ID', async () => {
    const input: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'WKR-001',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'MGR-001',
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: undefined,
    };

    const result = await saveProficiency(input);

    expect(result.proficiencyId).toBeDefined();
    expect(result.isNewRecord).toBe(true);

    const retrieveInput: GetProficiencyByIdInput = { proficiencyId: result.proficiencyId };
    const retrievedRecord = await getProficiencyById(retrieveInput);

    expect(retrievedRecord).toBeDefined();
    expect(retrievedRecord.proficiencyId).toBe(result.proficiencyId);
    expect(retrievedRecord.workerId).toBe('WKR-001');
    expect(retrievedRecord.jobType).toBe('ピッキング');
    expect(retrievedRecord.proficiencyLevel).toBe('中級');
    expect(retrievedRecord.evaluationDate).toBe('2024-01-15');
    expect(retrievedRecord.evaluatedBy).toBe('MGR-001');
    expect(retrievedRecord.createdBy).toBe('USR-001');
  });

  it('should assign a unique proficiency ID to each new record', async () => {
    const input1: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'WKR-002',
      jobType: '検査',
      proficiencyLevel: '上級',
      evaluationDate: '2024-01-16',
      evaluatedBy: 'MGR-002',
      remarks: null,
      createdBy: 'USR-002',
      updatedBy: undefined,
    };

    const input2: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'WKR-003',
      jobType: 'パッキング',
      proficiencyLevel: '初級',
      evaluationDate: '2024-01-17',
      evaluatedBy: 'MGR-003',
      remarks: null,
      createdBy: 'USR-003',
      updatedBy: undefined,
    };

    const result1 = await saveProficiency(input1);
    const result2 = await saveProficiency(input2);

    expect(result1.proficiencyId).toBeDefined();
    expect(result2.proficiencyId).toBeDefined();
    expect(result1.proficiencyId).not.toEqual(result2.proficiencyId);
  });

  it('should preserve all input data fields in the saved output', async () => {
    const input: SaveProficiencyInput = {
      proficiencyId: null,
      workerId: 'WKR-001',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'MGR-001',
      remarks: '実務経験1年、基本操作習得済み',
      createdBy: 'USR-001',
      updatedBy: undefined,
    };

    const result = await saveProficiency(input);

    expect(result.workerId).toBe(input.workerId);
    expect(result.jobType).toBe(input.jobType);
    expect(result.proficiencyLevel).toBe(input.proficiencyLevel);

    const retrieveInput: GetProficiencyByIdInput = { proficiencyId: result.proficiencyId };
    const retrievedRecord = await getProficiencyById(retrieveInput);

    expect(retrievedRecord.remarks).toBe(input.remarks);
    expect(retrievedRecord.createdBy).toBe(input.createdBy);
    expect(retrievedRecord.proficiencyLevel).toBe('中級');
  });
});