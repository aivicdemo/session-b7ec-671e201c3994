import { test, expect } from '@playwright/test';

test.describe('配信モーダル確定', () => {
  test('配置案確定時に配信ID・対象情報・進捗データが画面に表示される', async ({ page }) => {
    // ログイン画面からのアクセスを想定
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後、人員配置最適化提案・実行画面へ自動遷移を待機
    await page.waitForURL(/scr-1789461798629/);
    
    // 1. 人員配置最適化提案・実行画面を開く（ナビゲーションを確認）
    const proposalScreenLink = page.locator('[href*="scr-1789461798629"]');
    await expect(proposalScreenLink).toBeVisible();
    
    // 2. 画面に自動生成された人員配置案が表示される（拠点Cから作業者2名を拠点Aに配置、優先度再編成を含む）
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    // 配置案テーブルが表示されていることを確認
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    // 配置案の詳細内容を確認
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    await expect(proposalDetailContainer).toBeVisible();
    
    // 拠点Cからの配置、拠点Aへの配置、作業者数が同一の配置案内で表示されていることを確認
    const proposalText = await proposalDetailContainer.textContent();
    expect(proposalText).toContain('拠点C');
    expect(proposalText).toContain('拠点A');
    expect(proposalText).toContain('2名');
    
    // 優先度再編成の情報が存在することを確認
    expect(proposalText).toContain('優先度');
    
    // 配置の方向性（拠点Cから拠点Aへ）が適切に表示されていることを確認
    const cToAPattern = /拠点C[^拠]*拠点A|拠点C.*?\n.*?拠点A/;
    expect(proposalText).toMatch(cToAPattern);
    
    // 3. 配置案の『確定・配信』ボタンをクリック
    const distributeBtn = page.locator('#distribute-btn');
    await expect(distributeBtn).toBeEnabled();
    await distributeBtn.click();
    
    // 4. 配信確認ダイアログが表示される
    const distributeModal = page.locator('#distribute-modal-overlay');
    await expect(distributeModal).toBeVisible();
    
    // 5. ダイアログに表示された配信対象情報（拠点A、チームB、作業者ID群）と進捗スナップショット（完了数・残数・進捗率）を確認する
    const distributeModalContent = page.locator('#distribute-modal-content');
    await expect(distributeModalContent).toBeVisible();
    
    // 配信対象拠点「拠点A」、チーム「チームB」、作業者ID群が表示されていることを確認
    const modalText = await distributeModalContent.textContent();
    expect(modalText).toContain('拠点A');
    expect(modalText).toContain('チームB');
    
    // 作業者ID群と作業者数「5名」が表示されていることを確認
    expect(modalText).toContain('5名');
    
    // 進捗スナップショット「完了152/残48（75.3%）」が表示されていることを確認
    expect(modalText).toMatch(/完了152/);
    expect(modalText).toMatch(/残48/);
    expect(modalText).toMatch(/75\.3%/);
    
    // 6. ダイアログの『確定』ボタンをクリック
    const confirmBtn = page.locator('#distribute-modal-confirm');
    await expect(confirmBtn).toBeEnabled();
    
    // API呼び出しをインターセプトして検証
    const sendStaffingPlanPromise = page.waitForResponse(response => 
      response.url().includes('sendStaffingPlan') && response.status() === 200
    );
    
    const fetchProgressDataPromise = page.waitForResponse(response => 
      response.url().includes('fetchProgressData') && response.status() === 200
    );
    
    await confirmBtn.click();
    
    // 7. sendStaffingPlan呼び出し窓口が配置案を配信し、配信ID（例：『STFG-20250115-001』）とコールバックURL、タイムスタンプを返却する
    const sendStaffingPlanResponse = await sendStaffingPlanPromise;
    const sendStaffingPlanData = await sendStaffingPlanResponse.json();
    expect(sendStaffingPlanData).toHaveProperty('distributionId');
    expect(sendStaffingPlanData.distributionId).toMatch(/^STFG-\d{8}-\d{3}$/);
    expect(sendStaffingPlanData).toHaveProperty('callbackUrl');
    expect(sendStaffingPlanData).toHaveProperty('timestamp');
    
    const distributionId = sendStaffingPlanData.distributionId;
    const timestamp = sendStaffingPlanData.timestamp;
    const proposalId = sendStaffingPlanData.proposalId;
    
    // タイムスタンプが YYYY-MM-DD HH:MM:SS フォーマットであることを確認
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/);
    
    // 8. fetchProgressData呼び出し窓口から配信対象の進捗データ（完了数152件、残数48件、進捗率75.3%）が取得される
    const fetchProgressDataResponse = await fetchProgressDataPromise;
    const progressData = await fetchProgressDataResponse.json();
    expect(progressData).toHaveProperty('completed');
    expect(progressData.completed).toBe(152);
    expect(progressData).toHaveProperty('remaining');
    expect(progressData.remaining).toBe(48);
    expect(progressData).toHaveProperty('progressRate');
    expect(progressData.progressRate).toBeCloseTo(75.3, 1);
    
    // 配置案と進捗データの紐付きを確認
    expect(progressData).toHaveProperty('proposalId');
    expect(progressData.proposalId).toBe(proposalId);
    
    // モーダルが閉じることを確認
    await expect(distributeModal).not.toBeVisible();
    
    // 9. 画面上の配置案ステータスが『配信済み』に変わる
    await page.waitForTimeout(1000);
    const statusElement = page.locator('text=/配信済み/');
    await expect(statusElement).toBeVisible();
    
    // 10. 画面の配置案確認表示エリアに『配信ID: STFG-20250115-001』『配信対象: 拠点A、チームB、作業者5名』『進捗参照: 完了152/残48（75.3%）』『配信日時: 2025-01-15 14:32:45』が表示される
    const proposalResultContainer = page.locator('#proposal-detail-container');
    await expect(proposalResultContainer).toBeVisible();
    
    // 配置案確認表示エリア内のテキストを取得
    const resultContainerText = await proposalResultContainer.textContent();
    
    // 配信IDが表示されていることを確認（APIから返却された配信IDと一致）
    expect(resultContainerText).toMatch(/配信ID\s*[:：]\s*STFG-\d{8}-\d{3}/);
    
    // 配信対象情報が「配信対象: 拠点A、チームB、作業者5名」の形式で表示されていることを確認
    expect(resultContainerText).toMatch(/配信対象\s*[:：][\s\S]*拠点A[\s\S]*チームB[\s\S]*5名/);
    
    // 進捗参照情報が「進捗参照: 完了152/残48（75.3%）」の形式で表示されていることを確認
    expect(resultContainerText).toMatch(/進捗参照\s*[:：][\s\S]*完了152[\s\S]*\/[\s\S]*残48[\s\S]*75\.3%/);
    
    // 配信日時がラベル付きで表示され、YYYY-MM-DD HH:MM:SS フォーマットで画面に反映されていることを確認
    expect(resultContainerText).toContain('配信日時');
    expect(resultContainerText).toMatch(/配信日時\s*[:：]\s*\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
    
    // 配信ID、配信対象、進捗参照情報が同一コンテナ内に一貫性を持って表示されていることを確認
    const distributionIdElement = proposalResultContainer.locator('text=/配信ID/');
    await expect(distributionIdElement).toBeVisible();
    
    const siteAElement = proposalResultContainer.locator('text=/拠点A/');
    await expect(siteAElement).toBeVisible();
    
    const teamBElement = proposalResultContainer.locator('text=/チームB/');
    await expect(teamBElement).toBeVisible();
    
    const progressRefElement = proposalResultContainer.locator('text=/進捗参照/');
    await expect(progressRefElement).toBeVisible();
    
    const completed152Element = proposalResultContainer.locator('text=/完了152/');
    await expect(completed152Element).toBeVisible();
    
    const remaining48Element = proposalResultContainer.locator('text=/残48/');
    await expect(remaining48Element).toBeVisible();
    
    const progressRate753Element = proposalResultContainer.locator('text=/75\.3%/');
    await expect(progressRate753Element).toBeVisible();
    
    const deliveryDateElement = proposalResultContainer.locator('text=/配信日時/');
    await expect(deliveryDateElement).toBeVisible();
    
    // 配置案ID と進捗データが対応していることを確認（同じ配置案に紐付いていることを検証）
    const proposalIdLocator = proposalResultContainer.locator(`text=/${proposalId}/`);
    await expect(proposalIdLocator).toBeVisible();
    
    // すべての要素が同一コンテナ内に物理的に存在していることを検証
    const containerHTML = await proposalResultContainer.innerHTML();
    
    // 配信IDラベル、配信対象ラベル、進捗参照ラベル、配信日時ラベルが同一コンテナ内に存在することを検証
    expect(containerHTML).toMatch(/配信ID\s*[:：]/);
    expect(containerHTML).toMatch(/配信対象\s*[:：]/);
    expect(containerHTML).toMatch(/進捗参照\s*[:：]/);
    expect(containerHTML).toMatch(/配信日時\s*[:：]/);
    
    // 配信ID、配信対象、進捗情報、配信日時の値が同一コンテナ内に存在することを検証
    expect(containerHTML).toContain(distributionId);
    expect(containerHTML).toContain('拠点A');
    expect(containerHTML).toContain('チームB');
    expect(containerHTML).toContain('完了152');
    expect(containerHTML).toContain('残48');
    expect(containerHTML).toContain('75.3%');
    expect(containerHTML).toContain(timestamp);
    
    // 配置案と進捗データ、配信IDが一貫性を持って表示される構造を確認
    // 各要素（配信ID、配信対象、進捗参照、配信日時）がコンテナ内に順序を保って表示されることを検証
    const distributionIdIndex = containerHTML.indexOf('配信ID');
    const deliveryTargetIndex = containerHTML.indexOf('配信対象');
    const progressRefIndex = containerHTML.indexOf('進捗参照');
    const deliveryDateIndex = containerHTML.indexOf('配信日時');
    
    expect(distributionIdIndex).toBeGreaterThanOrEqual(0);
    expect(deliveryTargetIndex).toBeGreaterThanOrEqual(0);
    expect(progressRefIndex).toBeGreaterThanOrEqual(0);
    expect(deliveryDateIndex).toBeGreaterThanOrEqual(0);
    
    // 各ラベルが一定の順序関係を保っていることを確認
    expect(distributionIdIndex).toBeLessThan(deliveryTargetIndex);
    expect(deliveryTargetIndex).toBeLessThan(progressRefIndex);
    expect(progressRefIndex).toBeLessThan(deliveryDateIndex);
    
    // 配信IDラベルの直後に配信ID値が存在することを確認
    const distributionIdValueIndex = containerHTML.indexOf(distributionId);
    expect(distributionIdValueIndex).toBeGreaterThan(distributionIdIndex);
    expect(distributionIdValueIndex).toBeLessThan(deliveryTargetIndex);
    
    // 配信日時ラベルの直後にタイムスタンプ値が存在することを確認
    const timestampValueIndex = containerHTML.indexOf(timestamp);
    expect(timestampValueIndex).toBeGreaterThan(deliveryDateIndex);
    
    // 11. 作業指示・実績管理画面への遷移ボタンが有効化される
    await page.waitForTimeout(500);
    const nextScreenNav = page.locator('nav a[href*="scr-1789461813941"]');
    await expect(nextScreenNav).toBeEnabled();
  });
});