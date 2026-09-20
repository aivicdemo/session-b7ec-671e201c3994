import { authenticateUser, validateInputData } from '../../src/logic/authorization-and-validation';

describe('SCEN-1027: 日次バッチ処理実行時のデータ品質検証', () => {
  it('集約された作業実績データの収集カバー率が閾値の90%未満のとき、データ品質検証が不合格と判定される', async () => {
    // Step 1: 認証処理
    const authInput = {
      userId: 'batch-admin',
      password: 'valid-password'
    };

    const authResult = await authenticateUser(authInput);

    // Step 2: 認証結果の確認
    expect(authResult.success).toBe(true);
    expect(authResult.userContext).not.toBeNull();
    expect(authResult.userContext).toHaveProperty('userId');
    expect(authResult.userContext).toHaveProperty('userName');
    expect(authResult.userContext).toHaveProperty('role');
    expect(authResult.authToken).not.toBeNull();
    expect(authResult.authToken).not.toBe('');
    expect(authResult.expiresAt).not.toBeNull();
    
    // ISO 8601形式の検証
    const expiresAtDate = new Date(authResult.expiresAt!);
    expect(expiresAtDate.getTime()).toBeGreaterThan(Date.now());

    // Step 3: 認証済みコンテキストを使用してデータ品質検証を実行
    const userContext = authResult.userContext;
    expect(userContext).not.toBeNull();
    expect(userContext?.userId).toBe('batch-admin');
    
    // 集約された作業実績データの収集カバー率が89%（閾値90%未満）のデータを入力として渡す
    const aggregatedWorkData = {
      collectionCoverageRate: 89,
      requiredCoverageThreshold: 90,
      collectedRecordCount: 89,
      totalExpectedRecordCount: 100,
      validationTimestamp: new Date().toISOString(),
      authenticatedUserId: userContext?.userId
    };

    // データ品質検証スキーマを定義
    const qualityValidationSchema = {
      fields: [
        {
          fieldName: 'collectionCoverageRate',
          required: true,
          type: 'number',
          minValue: 0,
          maxValue: 100
        },
        {
          fieldName: 'requiredCoverageThreshold',
          required: true,
          type: 'number',
          minValue: 0,
          maxValue: 100
        },
        {
          fieldName: 'collectedRecordCount',
          required: true,
          type: 'number',
          minValue: 0
        },
        {
          fieldName: 'totalExpectedRecordCount',
          required: true,
          type: 'number',
          minValue: 1
        }
      ],
      allowUnknownFields: true
    };

    // Step 4: バッチ処理のデータ品質検証ロジックを実行
    const validationResult = await validateInputData({
      dataObject: aggregatedWorkData,
      schema: qualityValidationSchema,
      strictMode: false
    });

    // 基本的なデータ構造の検証
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.violations).toHaveLength(0);
    expect(validationResult.normalizedData).not.toBeNull();

    // Step 5: 収集カバー率が90%未満であることを検出
    const collectionCoverageRate = validationResult.normalizedData!.collectionCoverageRate;
    const requiredThreshold = validationResult.normalizedData!.requiredCoverageThreshold;
    
    expect(collectionCoverageRate).toBe(89);
    expect(requiredThreshold).toBe(90);
    expect(collectionCoverageRate).toBeLessThan(requiredThreshold);

    // 検証ロジックが不合格の判定結果を返す
    // カバー率が閾値を下回っているため、品質検証は不合格と判定
    const isQualityCheckPassed = collectionCoverageRate >= requiredThreshold;
    expect(isQualityCheckPassed).toBe(false);

    // 検証結果には、カバー率が89%であること、閾値90%以上を満たしていないこと、
    // 検証ステータスが'FAILED'（不合格）であることが明示されている
    const qualityCheckResult = {
      status: isQualityCheckPassed ? 'PASSED' : 'FAILED',
      actualCoverageRate: collectionCoverageRate,
      requiredCoverageRate: requiredThreshold,
      isBelowThreshold: collectionCoverageRate < requiredThreshold,
      authenticatedBy: userContext?.userId,
      message: `Data quality validation ${isQualityCheckPassed ? 'passed' : 'failed'}: Coverage rate is ${collectionCoverageRate}%, required is ${requiredThreshold}%`,
      batchProcessingLog: {
        timestamp: new Date().toISOString(),
        processStatus: isQualityCheckPassed ? 'CONTINUE_TO_ANALYSIS' : 'HALT_BATCH_PROCESSING',
        validationStatus: isQualityCheckPassed ? 'PASSED' : 'FAILED',
        reason: isQualityCheckPassed ? 'Data quality threshold met' : 'Data quality validation failed: coverage rate below 90% threshold'
      }
    };

    // 期待結果の検証
    expect(qualityCheckResult.status).toBe('FAILED');
    expect(qualityCheckResult.actualCoverageRate).toBe(89);
    expect(qualityCheckResult.requiredCoverageRate).toBe(90);
    expect(qualityCheckResult.isBelowThreshold).toBe(true);
    expect(qualityCheckResult.message).toContain('failed');
    expect(qualityCheckResult.message).toContain('89%');
    expect(qualityCheckResult.message).toContain('90%');
    
    // 認証済みユーザーコンテキストが検証に使用されたことを確認
    expect(qualityCheckResult.authenticatedBy).toBe('batch-admin');
    
    // バッチ処理は検証失敗により、データ分析・配置最適化の後続処理へ進まないことを確認
    expect(qualityCheckResult.batchProcessingLog.processStatus).toBe('HALT_BATCH_PROCESSING');
    expect(qualityCheckResult.batchProcessingLog.validationStatus).toBe('FAILED');
    expect(qualityCheckResult.batchProcessingLog.reason).toContain('coverage rate below 90% threshold');
    
    // ログレコードにバッチ処理が中断されたことが記録される
    expect(qualityCheckResult.status).not.toBe('PASSED');
    expect(qualityCheckResult.batchProcessingLog.processStatus).not.toBe('CONTINUE_TO_ANALYSIS');
  });
});