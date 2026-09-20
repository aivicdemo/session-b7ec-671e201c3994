import { saveProficiency } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-638: proficiencyLevelが定義済み値域外だと習熟度レベル無効エラーが発生する', () => {
  beforeEach(() => {
    jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: '仕分け',
      operatingStatus: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'U001',
    });

    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('proficiencyLevelが定義済み値域外の値を指定したときにInvalidProficiencyLevelエラーが発生する', async () => {
    const input = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '仕分け',
      proficiencyLevel: '上級者',
      evaluationDate: '2025-01-10',
      evaluatedBy: 'E001',
      remarks: undefined,
      createdBy: 'U001',
      updatedBy: undefined,
    };

    await expect(saveProficiency(input)).rejects.toEqual(
      expect.objectContaining({
        name: 'InvalidProficiencyLevel',
        message: '習熟度レベル 上級者 は無効です。有効な値: 初級、中級、上級、エキスパート。',
      })
    );
  });
});