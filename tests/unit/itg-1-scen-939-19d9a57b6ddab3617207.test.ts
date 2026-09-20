import { saveProductivityData } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-939: saveProductivityData - ReferentialIntegrityViolation for invalid teamId', () => {
  let validateReferentialIntegritySpy: jest.SpyInstance;
  let dbSaveOperationSpy: jest.SpyInstance;

  beforeEach(() => {
    validateReferentialIntegritySpy = jest
      .spyOn(dataPersistence as any, 'validateReferentialIntegrity')
      .mockImplementation((workResultId: string, workerId: string, facilityId: string, teamId: string) => {
        if (teamId === 'TEAM-INVALID') {
          return false;
        }
        return true;
      });

    dbSaveOperationSpy = jest
      .spyOn(dataPersistence as any, 'persistProductivityDataToDB')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return ReferentialIntegrityViolation error when teamId does not exist', async () => {
    const inputData = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-INVALID',
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
      updatedBy: null,
    };

    const result = await saveProductivityData(inputData);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('errorName');
    expect(result.errorName).toBe('ReferentialIntegrityViolation');
    expect(result).toHaveProperty('message');
    expect(result.message).toBe('参照先の作業実績、作業者、拠点、チームが見つかりません。');

    expect(dbSaveOperationSpy).toHaveBeenCalledTimes(0);
  });
});