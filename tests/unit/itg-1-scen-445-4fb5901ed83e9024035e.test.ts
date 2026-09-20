import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-445: 作業が営業時間をまたぐ場合、営業時間内の部分だけを計算対象とした実績作業時間を返す', () => {
    it('営業開始前に開始し営業時間内に終了する場合、営業時間内の部分のみを計算対象として実績作業時間を返す', async () => {
      const result = await calculateWorkHours({
        startDateTime: '2024-01-15T08:00:00+09:00',
        endDateTime: '2024-01-15T14:00:00+09:00',
        businessHoursStart: '09:00',
        businessHoursEnd: '18:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        applyBreakAdjustment: true,
        applyBusinessHoursAdjustment: true,
        timeZone: 'Asia/Tokyo',
        allowPastDateTime: true,
      });

      expect(typeof result).toBe('number');
      expect(result).toBe(240);
    });
  });
});