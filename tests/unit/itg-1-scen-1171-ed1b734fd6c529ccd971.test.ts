import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';
import * as allocationRepo from '../../src/repositories/allocation-plan.repository';
import * as workInstructionRepo from '../../src/repositories/work-instruction.repository';
import * as teamRepo from '../../src/repositories/team.repository';
import * as workerRepo from '../../src/repositories/worker.repository';
import * as allocationExecutionRepo from '../../src/repositories/allocation-execution-status.repository';
import * as deliveryHistoryRepo from '../../src/repositories/work-instruction-delivery-history.repository';
import * as handyTerminalLogRepo from '../../src/repositories/handy-terminal-sync-log.repository';
import * as wmsLogRepo from '../../src/repositories/wms-sync-log.repository';
import * as notificationService from '../../src/services/notification.service';

jest.mock('../../src/repositories/allocation-plan.repository');
jest.mock('../../src/repositories/work-instruction.repository');
jest.mock('../../src/repositories/team.repository');
jest.mock('../../src/repositories/worker.repository');
jest.mock('../../src/repositories/allocation-execution-status.repository');
jest.mock('../../src/repositories/work-instruction-delivery-history.repository');
jest.mock('../../src/repositories/handy-terminal-sync-log.repository');
jest.mock('../../src/repositories/wms-sync-log.repository');
jest.mock('../../src/services/notification.service');

describe('SCEN-1171: deliverAllocationInstructionToFieldLeader', () => {
  describe('配信チャネルの一部だけが利用可能なとき', () => {
    it('利用可能なチャネルのみで配信を実行し、成功したチャネルと各対象者の配信ステータスを返す', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const emailDeliveredAt = new Date('2024-01-15T10:00:05Z');
      const appDeliveredAt = new Date('2024-01-15T10:00:10Z');

      // 入力値をセット
      const input = {
        allocationPlanId: 'alloc-001',
        workInstructionId: 'work-001',
        teamId: 'team-01',
        facilityId: 'facility-01',
        allocatedWorkerIds: ['worker-001', 'worker-002'],
        deliveryChannels: ['email', 'app_notification', 'handy_terminal'] as const,
        requestedByUserId: 'user-req-001',
        requestedAt: now,
      };

      // getAllocationPlanById スタブ設定
      (allocationRepo.getAllocationPlanById as jest.Mock).mockResolvedValue({
        allocationPlanId: 'alloc-001',
        status: 'approved',
        teamId: 'team-01',
        facilityId: 'facility-01',
        workInstructionId: 'work-001',
      });

      // getWorkInstructionById スタブ設定
      (workInstructionRepo.getWorkInstructionById as jest.Mock).mockResolvedValue({
        workInstructionId: 'work-001',
        workName: 'Test Work',
        status: 'active',
      });

      // getTeamById スタブ設定
      (teamRepo.getTeamById as jest.Mock).mockResolvedValue({
        teamId: 'team-01',
        teamName: 'Team Alpha',
        teamLeaderId: 'leader-001',
        status: 'active',
      });

      // getWorkerById スタブ設定
      (workerRepo.getWorkerById as jest.Mock).mockImplementation((workerId) => {
        if (workerId === 'worker-001' || workerId === 'worker-002') {
          return Promise.resolve({
            workerId,
            name: `Worker ${workerId}`,
            status: 'active',
          });
        }
        return Promise.reject(new Error('Worker not found'));
      });

      // listAllocationExecutionStatusByCondition スタブ設定
      (allocationExecutionRepo.listAllocationExecutionStatusByCondition as jest.Mock).mockResolvedValue([
        { workerId: 'worker-001', status: 'allocated' },
        { workerId: 'worker-002', status: 'allocated' },
      ]);

      // recordWorkInstructionDeliveryHistory スタブ設定
      (deliveryHistoryRepo.recordWorkInstructionDeliveryHistory as jest.Mock).mockResolvedValue({
        receptionHistoryId: 'history-001',
        success: true,
      });

      // recordHandyTerminalSyncLog スタブ設定
      (handyTerminalLogRepo.recordHandyTerminalSyncLog as jest.Mock).mockResolvedValue({
        handyTerminalSyncLogId: 'log-002',
        success: true,
      });

      // recordWmsSyncLog スタブ設定
      (wmsLogRepo.recordWmsSyncLog as jest.Mock).mockResolvedValue({
        wmsSyncLogId: 'log-003',
        success: true,
      });

      // 外部通知サービスのスタブ設定
      // email と app_notification のみ成功、handy_terminal はチャネルレベルエラー
      (notificationService.sendNotification as jest.Mock).mockImplementation(
        ({ channel }) => {
          if (channel === 'email') {
            return Promise.resolve({
              success: true,
              deliveredAt: emailDeliveredAt,
              deliveryId: 'delivery-email',
            });
          } else if (channel === 'app_notification') {
            return Promise.resolve({
              success: true,
              deliveredAt: appDeliveredAt,
              deliveryId: 'delivery-app',
            });
          } else if (channel === 'handy_terminal') {
            return Promise.reject(new Error('Channel not available: handy_terminal'));
          }
          return Promise.reject(new Error('Unknown channel'));
        }
      );

      // 対象処理を実行
      const result = await deliverAllocationInstructionToFieldLeader(input);

      // 出力値を検証: success フィールドを確認
      expect(result.success).toBe(true);

      // 出力値を検証: allocationPlanId フィールドが'alloc-001'であることを確認
      expect(result.allocationPlanId).toBe('alloc-001');

      // 出力値を検証: deliveredChannels フィールドが['email', 'app_notification']（'handy_terminal'を除外）であることを確認
      expect(result.deliveredChannels).toEqual(
        expect.arrayContaining(['email', 'app_notification'])
      );
      expect(result.deliveredChannels).not.toContain('handy_terminal');
      expect(result.deliveredChannels.length).toBe(2);

      // 出力値を検証: fieldLeaderDeliveryStatus の配列長が2（emailとapp_notification）であることを確認
      expect(result.fieldLeaderDeliveryStatus).toHaveLength(2);

      // 出力値を検証: fieldLeaderDeliveryStatus 内の各要素が userId='leader-001', channel は'email'または'app_notification', status='success', deliveredAt が Date型であることを確認
      result.fieldLeaderDeliveryStatus.forEach((status) => {
        expect(status.userId).toBe('leader-001');
        expect(['email', 'app_notification']).toContain(status.channel);
        expect(status.status).toBe('success');
        expect(status.deliveredAt).toBeInstanceOf(Date);
      });

      // email と app_notification の両チャネルがそれぞれ存在することを確認
      const fieldLeaderChannels = result.fieldLeaderDeliveryStatus.map((s) => s.channel);
      expect(fieldLeaderChannels).toContain('email');
      expect(fieldLeaderChannels).toContain('app_notification');

      // 出力値を検証: workerDeliveryStatus の配列長が4（worker-001と worker-002 × 2チャネル）であることを確認
      expect(result.workerDeliveryStatus).toHaveLength(4);

      // 出力値を検証: workerDeliveryStatus 内の各要素が workerId='worker-001'または'worker-002', channel は'email'または'app_notification', status='success', deliveredAt が Date型であることを確認
      result.workerDeliveryStatus.forEach((status) => {
        expect(['worker-001', 'worker-002']).toContain(status.workerId);
        expect(['email', 'app_notification']).toContain(status.channel);
        expect(status.status).toBe('success');
        expect(status.deliveredAt).toBeInstanceOf(Date);
      });

      // 各作業者ごとに email と app_notification の2チャネル分が存在することを確認
      const worker001Statuses = result.workerDeliveryStatus.filter((s) => s.workerId === 'worker-001');
      expect(worker001Statuses).toHaveLength(2);
      expect(worker001Statuses.map((s) => s.channel).sort()).toEqual(['app_notification', 'email']);

      const worker002Statuses = result.workerDeliveryStatus.filter((s) => s.workerId === 'worker-002');
      expect(worker002Statuses).toHaveLength(2);
      expect(worker002Statuses.map((s) => s.channel).sort()).toEqual(['app_notification', 'email']);

      // 出力値を検証: deliveryHistoryIds フィールドが['history-001', 'log-002', 'log-003']を含むことを確認
      expect(result.deliveryHistoryIds).toContain('history-001');
      expect(result.deliveryHistoryIds).toContain('log-002');
      expect(result.deliveryHistoryIds).toContain('log-003');

      // 出力値を検証: failureReason フィールドが null であることを確認
      expect(result.failureReason).toBeNull();
    });
  });
});