import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-442: タイムゾーンサポートエラーのテスト', () => {
    it('IANAタイムゾーンデータベースで認識されないタイムゾーンを指定した場合、TimeZoneNotSupportedErrorが発生すること', async () => {
      const input = {
        startDateTime: '2024-01-15T09:00:00+09:00',
        endDateTime: '2024-01-15T17:00:00+09:00',
        timeZone: 'Invalid/Timezone',
      };

      await expect(calculateWorkHours(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("指定されたタイムゾーン 'Invalid/Timezone' はサポートされていません"),
        })
      );
    });
  });
});