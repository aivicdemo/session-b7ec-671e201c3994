import { deleteDataByIdAndType } from '../../src/logic/data-persistence';

describe('SCEN-1134: deleteDataByIdAndType - unsupported dataType error handling', () => {
  it('should throw InvalidDataTypeError when dataType is not supported', async () => {
    const input = {
      dataType: 'unsupportedType',
      recordId: 'test-record-001',
      deletedBy: 'user-123',
    };

    await expect(deleteDataByIdAndType(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDataTypeError',
        message: '指定されたデータ型は削除対象として認識されていません。',
      })
    );
  });
});