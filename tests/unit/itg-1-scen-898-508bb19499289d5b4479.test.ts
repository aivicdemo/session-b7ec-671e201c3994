import { getProgressDataById } from '../../src/logic/data-persistence';

describe('SCEN-898: 進捗データ検索エラーハンドリング', () => {
  describe('getProgressDataById - progressDataId が undefined の場合', () => {
    it('InvalidProgressDataId エラーが発生し、エラー文言は「進捗データIDは必須です。」である', async () => {
      const progressDataId = undefined as any;

      try {
        await getProgressDataById({ progressDataId });
        fail('エラーが発生するはずですが、発生しませんでした');
      } catch (error) {
        expect(error).toEqual(
          expect.objectContaining({
            code: 'InvalidProgressDataId',
            message: '進捗データIDは必須です。',
          })
        );
      }
    });
  });
});