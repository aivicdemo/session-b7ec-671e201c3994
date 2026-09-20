import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AgentInput, Tx4Imp1AgentOutput, DeliveredWorkInstruction } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-076: deliveredInstructions に複数の配信記録が含まれる場合、各々の配信時刻と配信先が正確に記録される', () => {
  it('should record multiple delivery instructions with accurate timestamps and recipients', async () => {
    // テスト前提条件を設定
    const userId = 'user-valid-001';
    const facilityIds = ['facility-001', 'facility-002', 'facility-003'];
    const autoApprovalEnabled = true;

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      autoApprovalEnabled,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
    };

    // 複数の DeliveredWorkInstruction レコードをスタブ化
    const mockDeliveredInstructions: DeliveredWorkInstruction[] = [
      {
        workInstructionId: 'work-001',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-001',
        deliveryTimestamp: '2024-12-20T14:30:45.123Z',
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'work-002',
        deliveryMethod: 'email',
        deliveredToFieldLeaderId: 'leader-002',
        deliveryTimestamp: '2024-12-20T14:31:12.456Z',
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'work-003',
        deliveryMethod: 'system_notification',
        deliveredToFieldLeaderId: 'leader-003',
        deliveryTimestamp: '2024-12-20T14:32:00.789Z',
        deliveryStatus: 'delivered',
      },
    ];

    // AI client のモック実装
    const mockAiClient: Partial<Tx4Imp1AiClient> = {
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue({
        deliveredInstructions: mockDeliveredInstructions,
      }),
    };

    // runTx4Imp1Agent を呼び出し
    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient as Tx4Imp1AiClient);

    // deliveredInstructions 配列を抽出
    const { deliveredInstructions, executionStatus, errorSummary } = output;

    // deliveredInstructions 配列の長さが3以上であることを確認
    expect(deliveredInstructions.length).toBeGreaterThanOrEqual(3);

    // 配信記録の各要素を検証
    const timestamps: string[] = [];
    const deliveredToIds: string[] = [];

    deliveredInstructions.forEach((instruction, index) => {
      // タイムスタンプフィールドが ISO 8601形式であることを確認
      expect(instruction.deliveryTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );

      // タイムスタンプが UTC タイムゾーンで記録されていることを確認
      const timestamp = new Date(instruction.deliveryTimestamp);
      expect(timestamp.toString()).not.toContain('Invalid');
      expect(timestamp.toISOString()).toMatch(/Z$/);

      // 配信先フィールドが空でない文字列であることを確認
      expect(instruction.deliveredToFieldLeaderId).toBeTruthy();
      expect(typeof instruction.deliveredToFieldLeaderId).toBe('string');
      expect(instruction.deliveredToFieldLeaderId.length).toBeGreaterThan(0);

      // タイムスタンプと配信先を配列に追加
      timestamps.push(instruction.deliveryTimestamp);
      deliveredToIds.push(instruction.deliveredToFieldLeaderId);

      // 配信ステータスが 'delivered' または 'delivery_failed' であることを確認
      expect(['delivered', 'delivery_failed']).toContain(instruction.deliveryStatus);

      // 配信方法が有効な値であることを確認
      expect(['handy_terminal', 'email', 'system_notification']).toContain(
        instruction.deliveryMethod
      );

      // 作業指示IDが設定されていることを確認
      expect(instruction.workInstructionId).toBeTruthy();
    });

    // 異なるインデックスのタイムスタンプ値が互いに異なること（重複がないこと）を確認
    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(timestamps.length);

    // 異なるインデックスの配信先値が互いに異なること（異なる配信先であること）を確認
    const uniqueDeliveredToIds = new Set(deliveredToIds);
    expect(uniqueDeliveredToIds.size).toBe(deliveredInstructions.length);

    // タイムスタンプが時系列順に保持されていることを確認
    for (let i = 1; i < timestamps.length; i++) {
      const prevTimestamp = new Date(timestamps[i - 1]).getTime();
      const currTimestamp = new Date(timestamps[i]).getTime();
      expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }

    // executionStatus が 'completed' または 'partial_completion' であることを確認
    expect(['completed', 'partial_completion']).toContain(executionStatus);

    // errorSummary が null であることを確認（正常完了を示す）
    expect(errorSummary).toBeNull();

    // executionId が設定されていることを確認
    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');

    // monitoringTimestamp が ISO 8601形式であることを確認
    expect(output.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );
  });

  it('should handle edge case where all delivery instructions have different timestamps and recipients', async () => {
    const userId = 'user-valid-002';
    const facilityIds = ['facility-004', 'facility-005'];

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      autoApprovalEnabled: true,
    };

    // 複数の異なるタイムスタンプと配信先を持つモック
    const mockDeliveredInstructions: DeliveredWorkInstruction[] = [
      {
        workInstructionId: 'work-004',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-004',
        deliveryTimestamp: '2024-12-20T15:00:00.000Z',
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'work-005',
        deliveryMethod: 'email',
        deliveredToFieldLeaderId: 'leader-005',
        deliveryTimestamp: '2024-12-20T15:01:30.500Z',
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'work-006',
        deliveryMethod: 'system_notification',
        deliveredToFieldLeaderId: 'leader-006',
        deliveryTimestamp: '2024-12-20T15:02:45.999Z',
        deliveryStatus: 'delivery_failed',
      },
    ];

    const mockAiClient: Partial<Tx4Imp1AiClient> = {
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue({
        deliveredInstructions: mockDeliveredInstructions,
      }),
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient as Tx4Imp1AiClient);

    const { deliveredInstructions } = output;

    if (deliveredInstructions.length >= 3) {
      // すべての配信記録のタイムスタンプが異なることを確認
      const timestamps = deliveredInstructions.map((instr) => instr.deliveryTimestamp);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(timestamps.length);

      // すべての配信記録の配信先が異なることを確認
      const deliveredToIds = deliveredInstructions.map((instr) => instr.deliveredToFieldLeaderId);
      const uniqueDeliveredToIds = new Set(deliveredToIds);
      expect(uniqueDeliveredToIds.size).toBe(deliveredToIds.length);

      // タイムスタンプが有効な ISO 8601形式であることを確認
      deliveredInstructions.forEach((instruction) => {
        expect(instruction.deliveryTimestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
        );
        expect(instruction.deliveredToFieldLeaderId).toBeTruthy();
      });
    }
  });
});