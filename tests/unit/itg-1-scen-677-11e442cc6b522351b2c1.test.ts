import { saveWorkInstruction, getFacilityById } from '../../src/logic/data-persistence';
import { SaveWorkInstructionInput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    getFacilityById: jest.fn(),
  };
});

describe('SCEN-677: saveWorkInstruction - FacilityNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw FacilityNotFound error when facilityId does not exist in facility master', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'FAC-99999',
      teamId: 'TEAM-001',
      workInstructionNumber: 'WI-20250101-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '中',
      createdBy: 'USR-001',
      updatedBy: null,
    };

    (getFacilityById as jest.Mock).mockResolvedValueOnce(null);

    await expect(saveWorkInstruction(input)).rejects.toMatchObject({
      name: 'FacilityNotFound',
      message: '指定された拠点が見つかりません。',
    });

    expect(getFacilityById).toHaveBeenCalledWith({ facilityId: 'FAC-99999' });
  });
});