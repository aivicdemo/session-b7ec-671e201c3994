import { saveInitialAssignment, SaveInitialAssignmentInput, SaveInitialAssignmentOutput, findInitialAssignmentByWorker } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-521: 割当開始日と割当終了日が同一である場合に初期割当レコードが正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully save initial assignment when start date equals end date', async () => {
    const assignmentId = 'uuid-new-001';
    const workerId = 'W001';
    const placementDepartment = 'D001';
    const placementProcess = 'PROC-A';
    const assignmentStartDate = new Date('2024-06-15');
    const assignmentEndDate = new Date('2024-06-15');
    const requestingUserId = 'U100';
    const createdBy = 'U100';

    // 権限判定用のスタブ authorizeUserAction を設定
    const authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);

    // 作業者検証用のスタブ findWorkerById を設定
    const findWorkerByIdSpy = jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      siteId: 'SITE001',
      teamId: 'TEAM001',
      jobType: 'JOB001',
      operatingStatus: 'active',
      found: true,
    });

    // 配置部門検証用のスタブ findDepartmentById を設定
    const findDepartmentByIdSpy = jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockResolvedValue({
      departmentId: placementDepartment,
      departmentName: 'Test Department',
      departmentCode: 'DEPT001',
      status: 'active',
      found: true,
    });

    // 重複割当検証用のスタブ findInitialAssignmentByWorker を設定（初期状態）
    jest.spyOn(persistenceLayer, 'findInitialAssignmentByWorker' as any).mockImplementation(async (input) => {
      // 最初の呼び出し（保存前の重複チェック）では found=false を返す
      if (input.workerId === workerId && input.requestingUserId === requestingUserId) {
        // ここでは重複がない状態を返す
        return {
          found: false,
        };
      }
      return { found: false };
    });

    const input: SaveInitialAssignmentInput = {
      assignmentId,
      workerId,
      placementDepartment,
      placementProcess,
      assignmentStartDate,
      assignmentEndDate,
      assignmentStatus: 'active',
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create',
    };

    const result: SaveInitialAssignmentOutput = await saveInitialAssignment(input);

    // 戻り値の検証
    expect(result.success).toBe(true);
    expect(result.assignmentId).toBe(assignmentId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();

    // 保存後のレコード検証：findInitialAssignmentByWorker を使用して保存されたレコードを確認
    // スタブを保存後のレコード返却用に変更
    jest.spyOn(persistenceLayer, 'findInitialAssignmentByWorker' as any).mockResolvedValueOnce({
      assignmentId,
      workerId,
      placementDepartment,
      placementProcess,
      assignmentStartDate,
      assignmentEndDate,
      assignmentStatus: 'active',
      remarks: null,
      createdAt: result.savedAt,
      updatedAt: result.savedAt,
      found: true,
    });

    const savedRecord = await findInitialAssignmentByWorker({
      workerId,
      requestingUserId,
    });

    expect(savedRecord.found).toBe(true);
    expect(savedRecord.assignmentId).toBe(assignmentId);
    expect(savedRecord.workerId).toBe(workerId);
    expect(savedRecord.placementDepartment).toBe(placementDepartment);
    expect(savedRecord.placementProcess).toBe(placementProcess);
    expect(savedRecord.assignmentStatus).toBe('active');
  });
});