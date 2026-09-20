import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput, FindWorkTypeByIdInput, findWorkTypeById } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-594: descriptionが省略された場合保存される', () => {
  let authenticateUserStub: jest.Mock;
  let authorizeUserActionStub: jest.Mock;
  let validateInputDataStub: jest.Mock;
  let findWorkTypeByIdStub: jest.Mock;

  beforeEach(() => {
    authenticateUserStub = jest.spyOn(persistenceLayer as any, 'authenticateUser').mockResolvedValue(true);
    authorizeUserActionStub = jest.spyOn(persistenceLayer as any, 'authorizeUserAction').mockResolvedValue(true);
    validateInputDataStub = jest.spyOn(persistenceLayer as any, 'validateInputData').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save work type with undefined description and persist correctly to database', async () => {
    // Arrange
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT001',
      workTypeName: '梱包作業',
      description: undefined,
      standardProductivity: 100,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    // Act
    const result: SaveWorkTypeOutput = await saveWorkType(input);

    // Assert - verify SaveWorkTypeOutput
    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());

    // Verify that authenticateUser and authorizeUserAction were called successfully
    expect(authenticateUserStub).toHaveBeenCalledWith('user001');
    expect(authorizeUserActionStub).toHaveBeenCalled();

    // Verify that validateInputData was called and accepted undefined description
    expect(validateInputDataStub).toHaveBeenCalled();

    // Verify persistence by retrieving the saved record from database
    const retrieveInput: FindWorkTypeByIdInput = {
      workTypeId: 'WT001',
      requestingUserId: 'user001',
    };
    const retrievedRecord = await findWorkTypeById(retrieveInput);

    // Verify the record was persisted with correct values
    expect(retrievedRecord.found).toBe(true);
    expect(retrievedRecord.workTypeId).toBe('WT001');
    expect(retrievedRecord.workTypeName).toBe('梱包作業');
    expect(retrievedRecord.standardProductivity).toBe(100);
    expect(retrievedRecord.difficultyLevel).toBe('NORMAL');
    expect(retrievedRecord.activeFlag).toBe(true);
    // description should be null or undefined after persistence
    expect(retrievedRecord.description).toBeNull();
  });
});