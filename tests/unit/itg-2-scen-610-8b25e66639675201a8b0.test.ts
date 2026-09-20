import { saveDepartment, SaveDepartmentInput, SaveDepartmentOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-610: エラー：存在しない、または無効なステータスのユーザーIDを責任者として指定すると、責任者未検出エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ResponsibleUserNotFoundError when responsibleUserId does not exist', async () => {
    const input: SaveDepartmentInput = {
      departmentId: 'DEPT-001',
      departmentName: '営業部',
      departmentCode: 'SALES-01',
      description: null,
      parentDepartmentId: null,
      responsibleUserId: 'USER-NONEXISTENT',
      status: 'active',
      createdBy: 'USER-ADMIN',
      updatedBy: undefined,
      requestingUserId: 'USER-ADMIN',
      operation: 'create',
    };

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockResolvedValue(null);
    jest.spyOn(persistenceLayer, 'findUserById' as any).mockResolvedValue(null);

    const insertDepartmentSpy = jest.spyOn(persistenceLayer, 'insertDepartment' as any).mockResolvedValue(null);
    const updateDepartmentSpy = jest.spyOn(persistenceLayer, 'updateDepartment' as any).mockResolvedValue(null);

    let result: SaveDepartmentOutput | null = null;
    let thrownError: Error | null = null;

    try {
      result = await saveDepartment(input);
    } catch (error: unknown) {
      if (error instanceof Error) {
        thrownError = error;
      } else {
        throw error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('ResponsibleUserNotFoundError');
    expect(thrownError?.message).toBe(
      "責任者ユーザーID 'USER-NONEXISTENT' が見つからないか無効です。"
    );

    expect(insertDepartmentSpy).not.toHaveBeenCalled();
    expect(updateDepartmentSpy).not.toHaveBeenCalled();
  });
});