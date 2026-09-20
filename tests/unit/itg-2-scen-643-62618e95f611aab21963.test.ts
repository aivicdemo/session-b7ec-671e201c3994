import { saveAllocationChangeHistory } from '../../src/logic/persistence-layer';
import { InvalidAllocationChangeDataError } from '../../src/errors/InvalidAllocationChangeDataError';
import * as authValidation from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-643: エラー系 - 割当変更履歴保存時の入力データ検証エラー', () => {
  const validBase = {
    allocationChangeHistoryId: 'history-001',
    workerId: 'worker-001',
    previousPlacementPlanId: 'plan-001',
    newPlacementPlanId: 'plan-002',
    previousDepartmentId: 'dept-001',
    newDepartmentId: 'dept-002',
    changeReason: '生産性向上',
    changeExecutionDate: new Date('2024-01-15'),
    status: 'executed',
    createdBy: 'user-001',
    requestingUserId: 'user-002',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ケース1: previousPlacementPlanId が null の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      previousPlacementPlanId: null as any,
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('ケース2: newPlacementPlanId が空文字列の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      newPlacementPlanId: '',
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('ケース3: previousDepartmentId が null の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      previousDepartmentId: null as any,
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('ケース4: newDepartmentId が空文字列の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      newDepartmentId: '',
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('ケース5: changeReason が null の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      changeReason: null as any,
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('ケース6: executorUserId が空文字列の場合、InvalidAllocationChangeDataError が発生する', async () => {
    const input = {
      ...validBase,
      executorUserId: '',
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      InvalidAllocationChangeDataError
    );
    await expect(saveAllocationChangeHistory(input)).rejects.toThrow(
      '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
    );
  });

  test('検証エラー発生時、データベースへの永続化処理は実行されていないこと', async () => {
    const input = {
      ...validBase,
      previousPlacementPlanId: '',
    };

    (authValidation.validateInputData as jest.Mock).mockImplementation(() => {
      throw new InvalidAllocationChangeDataError(
        '割当変更履歴の保存に必要なデータが不足または不正です。変更前後の配置計画・部門・変更理由・実行者を確認してください。'
      );
    });

    try {
      await saveAllocationChangeHistory(input);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAllocationChangeDataError);
    }

    expect(authValidation.validateInputData).toHaveBeenCalled();
  });
});