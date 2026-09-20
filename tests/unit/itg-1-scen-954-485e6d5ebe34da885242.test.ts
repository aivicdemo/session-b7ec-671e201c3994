import { getProductivityDataById } from '../../src/logic/data-persistence';

describe('SCEN-954: 存在しない生産性データIDで取得を試みるとProductivityDataNotFoundエラーが発生する', () => {
  it('存在しない生産性データIDで取得を試みると、ProductivityDataNotFoundエラーが発生する', async () => {
    const input = {
      productivityDataId: 'non-existent-id-12345',
    };

    await expect(getProductivityDataById(input)).rejects.toThrow('生産性データが見つかりません');
    await expect(getProductivityDataById(input)).rejects.toThrow('non-existent-id-12345');
  });
});