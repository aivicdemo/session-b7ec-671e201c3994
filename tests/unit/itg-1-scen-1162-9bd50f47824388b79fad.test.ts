import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

describe('SCEN-1162: exportWorkInstructionAndResultsToCSV - ISO 8601形式外の日時値エラー処理', () => {
  const validUserId = 'user-authenticated-001';

  describe('ISO 8601形式に従わない日時値が検索条件に指定された場合', () => {
    test('plannedStartFromDateTimeにスラッシュ区切りが指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        plannedStartFromDateTime: '2024/01/01',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('plannedStartToDateTimeにスペース区切りが指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        plannedStartToDateTime: '2024-01-01 10:00:00',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('plannedEndFromDateTimeに月日年順序が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        plannedEndFromDateTime: '01-01-2024',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('plannedEndToDateTimeにドット区切りが指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        plannedEndToDateTime: '2024.01.01',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('actualStartFromDateTimeに秒未指定形式が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        actualStartFromDateTime: '2024-01-01T10:00',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('actualStartToDateTimeにタイムゾーンオフセット形式が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        actualStartToDateTime: '2024-01-01T10:00:00+09:00',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('actualEndFromDateTimeに区切り文字なし形式が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        actualEndFromDateTime: '20240101',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('actualEndToDateTimeに日本語表記が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        actualEndToDateTime: '2024年1月1日',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('複数の無効な日時値が指定された場合、InvalidFilterConditionErrorを発生させる', async () => {
      const input = {
        plannedStartFromDateTime: '2024/01/01',
        plannedEndToDateTime: '2024.01.01',
        actualStartFromDateTime: '2024-01-01T10:00',
        exportedBy: validUserId,
      };

      await expect(
        exportWorkInstructionAndResultsToCSV(input)
      ).rejects.toThrow(expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      }));
    });

    test('エラー発生時、CSVバイナリストリームが返されない', async () => {
      const input = {
        plannedStartFromDateTime: '2024/01/01',
        exportedBy: validUserId,
      };

      try {
        await exportWorkInstructionAndResultsToCSV(input);
        fail('例外がスローされるべき');
      } catch (error) {
        expect(error.name).toBe('InvalidFilterConditionError');
      }
    });

    test('エラー発生時、ファイル名が返されない', async () => {
      const input = {
        plannedStartToDateTime: '2024-01-01 10:00:00',
        exportedBy: validUserId,
      };

      try {
        await exportWorkInstructionAndResultsToCSV(input);
        fail('例外がスローされるべき');
      } catch (error) {
        expect(error.name).toBe('InvalidFilterConditionError');
      }
    });

    test('エラー発生時、MIMEタイプが返されない', async () => {
      const input = {
        plannedEndFromDateTime: '01-01-2024',
        exportedBy: validUserId,
      };

      try {
        await exportWorkInstructionAndResultsToCSV(input);
        fail('例外がスローされるべき');
      } catch (error) {
        expect(error.name).toBe('InvalidFilterConditionError');
      }
    });

    test('エラー発生時、レコード数が返されない', async () => {
      const input = {
        plannedEndToDateTime: '2024.01.01',
        exportedBy: validUserId,
      };

      try {
        await exportWorkInstructionAndResultsToCSV(input);
        fail('例外がスローされるべき');
      } catch (error) {
        expect(error.name).toBe('InvalidFilterConditionError');
      }
    });

    test('エラー発生時、エクスポート実行日時が返されない', async () => {
      const input = {
        actualStartFromDateTime: '2024-01-01T10:00',
        exportedBy: validUserId,
      };

      try {
        await exportWorkInstructionAndResultsToCSV(input);
        fail('例外がスローされるべき');
      } catch (error) {
        expect(error.name).toBe('InvalidFilterConditionError');
      }
    });
  });
});