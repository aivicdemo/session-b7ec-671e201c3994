import { findWorkTypeById } from '../../src/logic/persistence-layer';
import * as authorizeModule from '../../src/logic/authorization';
import * as dbModule from '../../src/infrastructure/database';

describe('SCEN-601: findWorkTypeById - Database Connection Error', () => {
  beforeAll(() => {
    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue(undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should throw DatabaseError when database connection fails', async () => {
    const workTypeId = 'WT001';
    const requestingUserId = 'USER123';

    jest.spyOn(dbModule, 'query').mockRejectedValueOnce(
      new Error('Connection timeout')
    );

    await expect(
      findWorkTypeById({
        workTypeId,
        requestingUserId
      })
    ).rejects.toThrow(expect.objectContaining({
      name: 'DatabaseError',
      message: 'Database error occurred while retrieving work type information.'
    }));
  });
});