import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-410: 参照整合性検証 - すべての参照フィールドが有効で論理的な関連性が成立する場合', () => {
  it('すべての参照フィールドが有効な形式で存在し、論理的な関連性が成立する場合、検証が成功して整合性結果を返す', () => {
    // 準備: validateReferentialIntegrity関数を呼び出すための入力データを準備
    const input = {
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      workerId: 'WRK-100',
      workInstructionId: 'INSTR-5001',
      allocationPlanId: 'PLAN-2024-001',
      proficiencyId: 'PROF-L3',
      requireAllReferences: false,
      expectedRelationships: [
        {
          sourceField: 'teamId',
          targetField: 'facilityId',
          sourceValue: 'TEAM-A',
          targetValue: 'FAC-001'
        },
        {
          sourceField: 'workerId',
          targetField: 'teamId',
          sourceValue: 'WRK-100',
          targetValue: 'TEAM-A'
        },
        {
          sourceField: 'workInstructionId',
          targetField: 'allocationPlanId',
          sourceValue: 'INSTR-5001',
          targetValue: 'PLAN-2024-001'
        }
      ]
    };

    // 実行: validateReferentialIntegrity(input)を呼び出す
    const result = validateReferentialIntegrity(input);

    // 検証1: 戻り値のisValidフィールドがtrueであることを確認
    expect(result.isValid).toBe(true);

    // 検証2: 戻り値のvalidatedReferences配列の長さが6であることを確認
    expect(result.validatedReferences).toHaveLength(6);

    // 検証3: validatedReferencesの各要素について、existsがtrue、relationshipValidがtrueであることを確認
    result.validatedReferences.forEach((ref) => {
      expect(ref.exists).toBe(true);
      expect(ref.relationshipValid).toBe(true);
    });

    // 検証4: violatedRulesが空配列であることを確認
    expect(result.violatedRules).toEqual([]);

    // 検証5: missingReferencesが空配列であることを確認
    expect(result.missingReferences).toEqual([]);

    // 検証6: invalidRelationshipsが空配列であることを確認
    expect(result.invalidRelationships).toEqual([]);
  });
});