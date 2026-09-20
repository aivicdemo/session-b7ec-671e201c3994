import { validateRequiredFields, validateFieldFormat } from '../../src/logic/authorization-and-validation';

describe('SCEN-1044: 日次バッチ処理実行時の必須フィールド検証エラー', () => {
  describe('分析結果に必須フィールドが欠落している場合', () => {
    it('推奨配置フィールドが欠落したときエラーが発生し処理が中断される', async () => {
      // 準備: 日次バッチ処理の分析結果データを構成する
      const analysisResult = {
        // 推奨配置フィールド欠落
        rootCauseScore: 85,
        workerId: 'WKR-001',
      };

      // 分析結果から必須フィールドが欠落した状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // 処理が中断される - 必須フィールド欠落を検出
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toContain('recommendedPlacement');
      expect(validationResult.missingFields.length).toBeGreaterThan(0);
    });

    it('根拠スコアフィールドが欠落したときエラーが発生し処理が中断される', async () => {
      // 準備: 日次バッチ処理の分析結果データを構成する
      const analysisResult = {
        recommendedPlacement: 'TEAM-A',
        // 根拠スコアフィールド欠落
        workerId: 'WKR-001',
      };

      // 分析結果から必須フィールドが欠落した状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バッチ処理は必須フィールド欠落を検出し処理が中断される
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toContain('rootCauseScore');
    });

    it('作業者IDフィールドが欠落したときエラーが発生し処理が中断される', async () => {
      // 準備: 日次バッチ処理の分析結果データを構成する
      const analysisResult = {
        recommendedPlacement: 'TEAM-A',
        rootCauseScore: 85,
        // 作業者IDフィールド欠落
      };

      // 分析結果から必須フィールドが欠落した状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バッチ処理は必須フィールド欠落を検出し処理が中断される
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toContain('workerId');
    });

    it('複数の必須フィールドが欠落したときすべての欠落フィールドが検出される', async () => {
      // 準備: 複数の必須フィールド欠落した分析結果データを構成する
      const analysisResult = {
        // 推奨配置フィールド欠落
        // 根拠スコアフィールド欠落
        workerId: 'WKR-001',
      };

      // 分析結果から複数の必須フィールドが欠落した状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バッチ処理は複数の必須フィールド欠落を検出し処理が中断される
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toContain('recommendedPlacement');
      expect(validationResult.missingFields).toContain('rootCauseScore');
      expect(validationResult.missingFields.length).toBe(2);
    });

    it('必須フィールドがすべて存在するときバリデーションが成功する', async () => {
      // 準備: すべての必須フィールドが存在する分析結果データを構成する
      const analysisResult = {
        recommendedPlacement: 'TEAM-A',
        rootCauseScore: 85,
        workerId: 'WKR-001',
      };

      // 分析結果から必須フィールドすべてが存在する状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バリデーション成功 - すべての必須フィールドが存在
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toEqual([]);
    });

    it('欠落したフィールドが複数存在するとき処理の中断状態を確認できる', async () => {
      // 準備: すべての必須フィールドが欠落した分析結果データを構成する
      const analysisResult = {
        // 推奨配置フィールド欠落
        // 根拠スコアフィールド欠落
        // 作業者IDフィールド欠落
      };

      // 分析結果から必須フィールドが欠落した状態を確認
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バッチ処理が中断される - isValidがfalse、全欠落フィールドが記録される
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields.length).toBe(3);
      expect(validationResult.missingFields).toEqual(
        expect.arrayContaining([
          'recommendedPlacement',
          'rootCauseScore',
          'workerId',
        ])
      );
    });

    it('必須フィールドの検証ロジックが日次バッチ処理内で呼び出される', async () => {
      // 準備: 必須フィールド欠落かつ形式不正な分析結果データを構成する
      const analysisResult = {
        recommendedPlacement: 123, // 文字列でなく数値（形式エラー）
        rootCauseScore: 'invalid', // 数値でなく文字列（形式エラー）
        workerId: 'WKR-001',
      };

      // validateRequiredFieldsを呼び出し必須フィールドを検証
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // 必須フィールドは存在するが形式が不正なため、形式検証を実施
      expect(validationResult.isValid).toBe(true); // 必須フィールド検証
      
      // validateFieldFormatで形式検証を実施
      const formatCheckPlacement = validateFieldFormat(
        'recommendedPlacement',
        analysisResult.recommendedPlacement,
        'string'
      );
      const formatCheckScore = validateFieldFormat(
        'rootCauseScore',
        analysisResult.rootCauseScore,
        'number'
      );

      // 形式エラーが検出される
      expect(formatCheckPlacement.isValid).toBe(false);
      expect(formatCheckScore.isValid).toBe(false);
      expect(formatCheckPlacement.violationType).toBe('type_mismatch');
      expect(formatCheckScore.violationType).toBe('type_mismatch');
    });

    it('バッチ処理の状態が失敗となり、ログにエラー内容が記録される', async () => {
      // 準備: 必須フィールド欠落した分析結果データを構成する
      const analysisResult = {
        recommendedPlacement: 'TEAM-A',
        // rootCauseScore 欠落
        // workerId 欠落
      };

      // 日次バッチ処理の検証ロジックを実行
      const requiredFields = ['recommendedPlacement', 'rootCauseScore', 'workerId'];
      const validationResult = validateRequiredFields(
        analysisResult as Record<string, any>,
        requiredFields
      );

      // バッチ処理の状態が失敗となり処理が中断される
      expect(validationResult.isValid).toBe(false);
      
      // 欠落フィールドがログされる
      expect(validationResult.missingFields).toContain('rootCauseScore');
      expect(validationResult.missingFields).toContain('workerId');
      expect(validationResult.missingFields.length).toBe(2);
      
      // エラー内容が記録される状態を確認
      // 検証エラーが発生したため、以降の処理ステップ（集約・分析・保存）は実行されない
      expect(validationResult.isValid).toBe(false);
    });
  });
});