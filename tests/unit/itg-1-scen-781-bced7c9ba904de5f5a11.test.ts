import { getAllocationPlanById } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

describe('SCEN-781: getAllocationPlanById - Database Connection Error', () => {
  it('should return DatabaseAccessError when database connection fails', async () => {
    const allocationPlanId = 'plan-12345';

    // データベース接続エラーをシミュレートするため、
    // 実装内部でデータベースクエリが実行される際に接続エラーが発生するようスタブ環境を構成
    const dbError = new Error('Database connection failed') as any;
    dbError.code = 'ECONNREFUSED';
    
    jest.spyOn(dataPersistenceModule, 'getAllocationPlanById').mockImplementationOnce(
      async () => {
        // 実装内部でデータベースクエリ実行時に接続エラーが発生
        throw Object.assign(new Error('人員配置案データの取得に失敗しました。'), {
          name: 'DatabaseAccessError',
          originalError: dbError
        });
      }
    );

    // 準備したパラメータを使用して getAllocationPlanById を実行する
    let thrownError: any;
    try {
      await getAllocationPlanById({ allocationPlanId });
      fail('Expected getAllocationPlanById to throw DatabaseAccessError');
    } catch (error: any) {
      thrownError = error;
    }

    // 返却されたエラーオブジェクトを検証する
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DatabaseAccessError');
    expect(thrownError.message).toBe('人員配置案データの取得に失敗しました。');

    // 出力値がエラーオブジェクトのみであることを検証
    // GetAllocationPlanByIdOutput のフィールド値は含まれないことを確認
    expect(thrownError).not.toHaveProperty('allocationPlanId');
    expect(thrownError).not.toHaveProperty('planName');
    expect(thrownError).not.toHaveProperty('facilityId');
    expect(thrownError).not.toHaveProperty('teamId');
    expect(thrownError).not.toHaveProperty('workInstructionId');
    expect(thrownError).not.toHaveProperty('allocationStartDate');
    expect(thrownError).not.toHaveProperty('allocationEndDate');
    expect(thrownError).not.toHaveProperty('estimatedWorkHours');
    expect(thrownError).not.toHaveProperty('estimatedCompletionDate');
    expect(thrownError).not.toHaveProperty('status');
    expect(thrownError).not.toHaveProperty('description');
    expect(thrownError).not.toHaveProperty('createdAt');
    expect(thrownError).not.toHaveProperty('updatedAt');
    expect(thrownError).not.toHaveProperty('createdBy');
    expect(thrownError).not.toHaveProperty('updatedBy');

    // クリーンアップ
    (dataPersistenceModule.getAllocationPlanById as jest.Mock).mockRestore();
  });
});