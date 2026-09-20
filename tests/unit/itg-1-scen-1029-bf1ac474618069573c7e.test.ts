import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1029: saveWorkInstructionReceptionHistory - InvalidConfirmationDateTimeError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidConfirmationDateTimeError when confirmationDateTime is before receptionDateTime', async () => {
    // スタブ化: validateReferentialIntegrity - 参照整合性チェック成功
    jest.spyOn(dataPersistence, 'validateReferentialIntegrity' as any).mockResolvedValue(undefined);

    // スタブ化: validateDuplicateReception - 重複チェック成功
    jest.spyOn(dataPersistence, 'validateDuplicateReception' as any).mockResolvedValue(undefined);

    const input = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      receptionDateTime: '2024-01-15T10:00:00.000Z',
      receptionStatus: 'confirmed',
      confirmationDateTime: '2024-01-15T09:59:59.999Z',
      deliveryMethod: 'handy_terminal',
      createdBy: 'ADMIN-001',
      remarks: null,
      updatedBy: null,
    };

    // エラーがスローされることを確認
    let errorThrown = false;
    let thrownError: any = null;

    try {
      await saveWorkInstructionReceptionHistory(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error;
    }

    // InvalidConfirmationDateTimeError がスローされたことを確認
    expect(errorThrown).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InvalidConfirmationDateTimeError');
    expect(thrownError.message).toBe(
      `確認日時 '2024-01-15T09:59:59.999Z' は受領日時より前です。`
    );

    // 戻り値が出力型ではなく例外のみが発生することを確認
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError).not.toHaveProperty('receptionHistoryId');
    expect(thrownError).not.toHaveProperty('savedAt');
  });
});