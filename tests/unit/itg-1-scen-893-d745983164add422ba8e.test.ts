import { 
  saveProgressData, 
  SaveProgressDataInput,
  GetWorkInstructionByIdInput,
  SaveWorkInstructionInput,
} from '../../src/logic/data-persistence';

describe('進捗データ永続化処理 - SCEN-893', () => {
  describe('進捗日の検証', () => {
    it('進捗日が作業指示の予定終了日より後である場合、InvalidProgressDateエラーが発生する', async () => {
      // Arrange: 作業指示を事前に作成
      const testUserId = 'user-test-001';
      const facilityId = 'fac-test-001';
      const teamId = 'team-test-001';

      const workInstructionInput: SaveWorkInstructionInput = {
        workInstructionId: null,
        facilityId: facilityId,
        teamId: teamId,
        workInstructionNumber: 'WI-TEST-893-001',
        workName: 'テスト作業',
        workDescription: '進捗日検証用テスト',
        plannedStartDateTime: '2024-01-01T00:00:00Z',
        plannedEndDateTime: '2024-01-10T23:59:59Z',
        progressStatus: '未開始',
        progressRate: undefined,
        requiredWorkerCount: 5,
        priority: '中',
        createdBy: testUserId,
        updatedBy: undefined,
      };

      const workInstructionOutput = await (global as any).mockSaveWorkInstruction?.(workInstructionInput) || {
        workInstructionId: 'wi-test-893-001',
        workInstructionNumber: 'WI-TEST-893-001',
        facilityId: facilityId,
        teamId: teamId,
        workName: 'テスト作業',
        savedAt: new Date().toISOString(),
        isNewRecord: true,
      };
      const workInstructionId = workInstructionOutput.workInstructionId;

      // 作業指示の予定終了日を確認し、validateDateTimeRange相当の検証を実施
      const plannedEndDateTime = '2024-01-10T23:59:59Z';
      const progressDate = '2024-01-11T10:00:00Z';

      // validateDateTimeRange相当の検証: progressDateが予定終了日より後であることを確認
      const isProgressDateAfterPlannedEnd = new Date(progressDate) > new Date(plannedEndDateTime);
      expect(isProgressDateAfterPlannedEnd).toBe(true);

      const saveProgressDataInput: SaveProgressDataInput = {
        progressDataId: null,
        workInstructionId: workInstructionId,
        facilityId: facilityId,
        teamId: teamId,
        progressDate: progressDate,
        plannedQuantity: 100,
        actualQuantity: 50,
        completionRate: undefined,
        delayFlag: undefined,
        delayDays: undefined,
        remarks: undefined,
        createdBy: testUserId,
        updatedBy: undefined,
      };

      // Act & Assert: saveProgressData関数を呼び出し、InvalidProgressDateエラーが発生することを確認
      let errorThrown = false;
      let errorMessage = '';
      let errorName = '';

      try {
        await saveProgressData(saveProgressDataInput);
      } catch (error: any) {
        errorThrown = true;
        errorMessage = error?.message || '';
        errorName = error?.name || error?.constructor?.name || '';
      }

      // Assert: エラーが発生し、適切なエラー型と文言が返されることを確認
      expect(errorThrown).toBe(true);
      expect(errorName).toContain('InvalidProgressDate');
      expect(errorMessage).toContain('進捗日が作業指示の期間外です。');
    });
  });
});