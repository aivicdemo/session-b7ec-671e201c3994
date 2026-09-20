import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-092: 入力データ検証エラー', () => {
  it('userIdが未定義の場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: undefined,
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: ['fac-001', 'fac-002'],
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        name: expect.stringMatching(/InvalidInputData|Error/),
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('userIdがnullの場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: null,
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: ['fac-001', 'fac-002'],
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('orderSurgeEventが未定義の場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: 'user-001',
      orderSurgeEvent: undefined,
      targetFacilityIds: ['fac-001', 'fac-002'],
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('targetFacilityIdsが未定義の場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: 'user-001',
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: undefined,
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('orderSurgeEventの必須フィールドが欠ける場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: 'user-001',
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        // surgePercentageが欠ける
      },
      targetFacilityIds: ['fac-001', 'fac-002'],
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('targetFacilityIdsが空配列の場合、InvalidInputDataエラーが発生する', async () => {
    const invalidInput = {
      userId: 'user-001',
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: [],
    };

    await expect(runTx6Imp1Agent(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('入力データが不正です'),
      })
    );
  });

  it('エラー発生時には出力が返されない', async () => {
    const invalidInput = {
      userId: null,
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: ['fac-001'],
    };

    try {
      await runTx6Imp1Agent(invalidInput as any);
      fail('エラーが発生する必要があります');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error).not.toHaveProperty('executionStatus');
      expect(error).not.toHaveProperty('analysisResult');
      expect(error).not.toHaveProperty('generatedAllocationPlans');
    }
  });

  it('エラーメッセージに必須フィールド確認の指示が含まれる', async () => {
    const invalidInput = {
      userId: undefined,
      orderSurgeEvent: {
        eventId: 'evt-001',
        facilityId: 'fac-001',
        detectionTimestamp: '2024-01-01T10:00:00Z',
        surgeQuantity: 100,
        surgePercentage: 50,
      },
      targetFacilityIds: ['fac-001'],
    };

    try {
      await runTx6Imp1Agent(invalidInput as any);
      fail('エラーが発生する必要があります');
    } catch (error: any) {
      expect(error.message).toMatch(/必須フィールド|形式/);
    }
  });
});