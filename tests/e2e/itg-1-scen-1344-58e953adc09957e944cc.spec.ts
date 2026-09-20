import { test, expect } from "@playwright/test";

test("作業指示・実績管理画面への遷移操作が監査ログに記録される", async ({
  page,
  context,
}) => {
  // 前提：人員配置最適化提案・実行画面にログイン済みの状態
  await page.goto("/panels/scr-1789461798629.html");

  // Step1: 人員配置最適化提案・実行画面に表示されていることを確認
  const pageTitle = page.locator("text=人員配置最適化提案");
  await expect(pageTitle).toBeVisible();

  // Step2: 配置案の中から1件を選択
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();

  // 配置案の選択可能な要素を取得
  const proposalItems = page.locator('[id="proposals-container"] > div');
  const itemCount = await proposalItems.count();
  expect(itemCount).toBeGreaterThan(0);

  // 1件目の配置案を選択
  const firstProposal = proposalItems.first();
  await firstProposal.click();

  // 配置案が選択されたことを確認（詳細が表示される）
  const proposalDetail = page.locator('[id="proposal-detail-container"]');
  await expect(proposalDetail).toBeVisible();

  // 配置案IDを要素の属性またはdata属性から取得
  const proposalIdAttr = await firstProposal.getAttribute("data-proposal-id");
  const proposalId = proposalIdAttr || (await firstProposal.getAttribute("id")) || "unknown";

  // Step3: 作業指示・実績管理画面へ遷移するボタンをクリック
  // 配置案選択後に表示される、配置案に紐付いた遷移ボタンをクリック
  const transitionButton = page.locator(
    '[id="proposal-detail-container"] button, [id="proposal-detail-container"] a'
  ).filter({ hasText: /作業指示|実績管理/ });

  await expect(transitionButton.first()).toBeVisible();
  
  // ナビゲーション開始時刻を記録
  const navigationStartTime = new Date();
  
  await transitionButton.first().click();

  // Step4: 作業指示・実績管理画面への遷移が完了し、対象のデータが表示されたことを確認
  await page.waitForURL("**/scr-1789461813941.html");
  const workInstructionList = page.locator(
    '[data-testid="work-instruction-list"]'
  );
  await expect(workInstructionList).toBeVisible();

  // Step5: システム監査ログAPI経由で遷移イベントに関する監査ログを取得
  const apiUrl = (await page.evaluate(
    () => (window as any).AIVIC_API_URL
  )) as string;
  const appId = (await page.evaluate(
    () => (window as any).AIVIC_APP_ID
  )) as string;

  // 監査ログテーブル取得
  const tables = (await page.evaluate(
    () => (window as any).AIVIC_TABLES
  )) as Record<string, string>;
  const auditLogTableId = tables["audit_logs"] || "audit_logs";

  // 監査ログを取得（直近のレコードを対象）
  const auditLogResponse = await page.request.get(
    `${apiUrl}/${auditLogTableId}?app=${appId}&limit=100&sort=-created_at`
  );
  const auditLogData = await auditLogResponse.json();

  // 期待結果の検証
  const toleranceMs = 1000; // ±1秒

  // 遷移イベントに関連する監査ログを検索
  const transitionLog = auditLogData.records?.find((log: any) => {
    const logTime = new Date(log.timestamp || log.created_at);
    const timeDiff = Math.abs(
      navigationStartTime.getTime() - logTime.getTime()
    );

    return (
      timeDiff <= toleranceMs &&
      (log.operation_type === "画面遷移" ||
        log.operation_type === "作業指示・実績管理画面オープン") &&
      log.from_screen === "人員配置最適化提案・実行画面" &&
      log.to_screen === "作業指示・実績管理画面" &&
      log.status === "成功" &&
      (log.proposal_id === proposalId || proposalId === "unknown")
    );
  });

  // 監査ログが記録されていることを確認
  expect(transitionLog).toBeDefined();
  expect(transitionLog.user_id).toBeDefined();
  expect(transitionLog.timestamp || transitionLog.created_at).toBeDefined();
  expect(transitionLog.operation_type).toMatch(
    /画面遷移|作業指示・実績管理画面オープン/
  );
  expect(transitionLog.from_screen).toBe("人員配置最適化提案・実行画面");
  expect(transitionLog.to_screen).toBe("作業指示・実績管理画面");
  expect(transitionLog.status).toBe("成功");
});