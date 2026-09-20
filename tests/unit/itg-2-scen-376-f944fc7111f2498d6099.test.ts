import { buildOptimalPlacementProposalScreen } from '../../src/logic/optimal-placement-proposal-presentation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('SCEN-376: 配置案のステータスが確認・承認・実行画面で表示可能な状態でない場合', () => {
  let rejectedPlacementProposalId: string;
  let userId: string;
  let workerId: string;
  let departmentId: string;

  beforeAll(async () => {
    userId = 'test-user-' + Date.now();
    workerId = 'test-worker-' + Date.now();
    departmentId = 'test-dept-' + Date.now();

    // ユーザーを作成
    await prisma.ユーザー.create({
      data: {
        ユーザーID: userId,
        ユーザー名: 'test-user',
        メールアドレス: 'test@example.com',
        パスワードハッシュ: 'hash',
        氏名: 'Test User',
        役割: 'admin',
        ステータス: '有効',
        作成日時: new Date(),
        更新日時: new Date(),
        作成者: 'system',
      },
    });

    // 部門を作成
    await prisma.部門.create({
      data: {
        部門ID: departmentId,
        部門名: 'Test Department',
        部門コード: 'DEPT-' + Date.now(),
        ステータス: 'active',
        作成日時: new Date(),
        更新日時: new Date(),
      },
    });

    // 作業者を作成
    await prisma.作業者.create({
      data: {
        作業者ID: workerId,
        作業者名: 'Test Worker',
        拠点ID: departmentId,
        チームID: departmentId,
        職種: 'operator',
        稼働状況: '稼働中',
        作成日時: new Date(),
        更新日時: new Date(),
        作成者: userId,
      },
    });

    // 却下済み配置案を作成
    rejectedPlacementProposalId = 'rejected-proposal-' + Date.now();
    await prisma.人員配置案.create({
      data: {
        人員配置案ID: rejectedPlacementProposalId,
        配置案名: 'Rejected Placement',
        拠点ID: departmentId,
        チームID: departmentId,
        作業指示ID: 'work-order-' + Date.now(),
        配置開始日: new Date('2024-01-01'),
        予想工数: 100,
        ステータス: 'REJECTED',
        作成日時: new Date(),
        作成者: userId,
        更新日時: new Date(),
      },
    });

    // 生産性データは意図的に作成しない（0件の状態）
  });

  afterAll(async () => {
    // クリーンアップ
    await prisma.人員配置案.deleteMany({
      where: {
        人員配置案ID: rejectedPlacementProposalId,
      },
    });

    await prisma.作業者.deleteMany({
      where: {
        作業者ID: workerId,
      },
    });

    await prisma.部門.deleteMany({
      where: {
        部門ID: departmentId,
      },
    });

    await prisma.ユーザー.deleteMany({
      where: {
        ユーザーID: userId,
      },
    });

    await prisma.$disconnect();
  });

  it('却下済み配置案でInvalidPlacementProposalStateエラーを発生させる', async () => {
    const analysisPeriodStartDate = '2024-01-01';
    const analysisPeriodEndDate = '2024-01-31';

    let caughtError: Error | null = null;

    try {
      await buildOptimalPlacementProposalScreen({
        placement_proposal_id: rejectedPlacementProposalId,
        user_id: userId,
        analysis_period_start_date: analysisPeriodStartDate,
        analysis_period_end_date: analysisPeriodEndDate,
      });
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.name).toBe('InvalidPlacementProposalState');
    expect(caughtError?.message).toBe('この配置案は表示できない状態です。');
  });
});