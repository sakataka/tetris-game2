# Tetris AI 戦略改善計画

## 概要
現在のTetris AIは技術的には優秀（深度3探索、1,835ノード）だが、戦略的課題によりライン消去が実行されず早期ゲームオーバーに至る問題を抱えている。本ドキュメントは、O3とGeminiとの専門的議論を基に、根本的な改善策を提案する。

## 現在の問題分析

### ✅ 解決済み（技術的側面）
- AI停止問題 → 継続動作確認
- 探索性能 → 深度3、1,835ノード（43倍向上）
- 評価システム → Total Score表示、T-Spin検出

### ❌ 残存課題（戦略的側面）
- **ライン消去未実行** → Lines: 0が継続
- **早期ゲームオーバー** → 長期生存不可
- **局所最適化の罠** → 短期最適化に偏重

## 専門家からの戦略的提言

### O3による戦略分析
**根本原因**: 現在の線消去重み100.0は過大で、3手先探索では実現不可能な投機的クリアを追求している

**推奨改善策**:
1. **段階的戦略**: 盤面高さによる動的重み調整
   - **早期** (高さ≤6): クリーンスタック構築重視
   - **中期** (7-12): バランス型スコアリング
   - **後期** (≥13): 即座のライン消去による生存モード

2. **重み再調整**: 
   - 線消去: 100.0 → 3-8 (段階スケール)
   - 新要素: well_open (+4), escape_route (-6), blocks_above_holes (-4)

3. **多様化探索**: スコア最良とプロファイル多様性の組み合わせ

### Geminiによる技術実装指針
**実装アプローチ**: 既存アーキテクチャを維持しつつ段階的機能追加

**推奨実装順序**:
1. `new-weights.ts`: 新重み設定ファイル
2. `weights.ts`: 高さベース段階検出
3. `dellacherie.ts`: 新評価要素統合
4. `patterns.ts`: 開放パターン実装
5. `beam-search.ts`: 多様化探索

## 実装計画詳細

### 1. 段階的重み調整システム

#### 段階検出ロジック
```typescript
function determineGamePhase(maxHeight: number): GamePhase {
  if (maxHeight <= 6) return 'early';
  if (maxHeight <= 12) return 'mid';
  return 'late';
}
```

#### 段階別重み設定
```typescript
const PHASE_WEIGHTS = {
  early: {
    linesCleared: 3.0,
    holes: -10.0,
    bumpiness: -1.5,
    wellOpen: +2.0
  },
  mid: {
    linesCleared: 8.0,
    holes: -8.0,
    bumpiness: -1.0,
    wellOpen: +4.0,
    tSpinPotential: +5.0
  },
  late: {
    linesCleared: 20.0,
    holes: -6.0,
    immediateEscape: +15.0,
    maxHeightPenalty: -50.0
  }
};
```

### 2. 新評価要素

#### Well Open Detection
```typescript
function calculateWellOpen(board: Uint32Array): boolean {
  const rightmostColumn = 9;
  for (let row = 0; row < 20; row++) {
    if (board[row] & (1 << rightmostColumn)) return false;
  }
  return true;
}
```

#### Escape Route Analysis
```typescript
function calculateEscapeRoute(board: Uint32Array): number {
  let escapableColumns = 0;
  for (let col = 0; col < 10; col++) {
    let height = 0;
    for (let row = 19; row >= 0; row--) {
      if (board[row] & (1 << col)) {
        height = 20 - row;
        break;
      }
    }
    if (height <= 15) escapableColumns++;
  }
  return escapableColumns > 0 ? 0 : -6; // ペナルティ
}
```

#### Blocks Above Holes
```typescript
function calculateBlocksAboveHoles(board: Uint32Array): number {
  let penalty = 0;
  for (let col = 0; col < 10; col++) {
    let foundHole = false;
    for (let row = 0; row < 20; row++) {
      if (!(board[row] & (1 << col))) {
        foundHole = true;
      } else if (foundHole) {
        penalty += 0.5; // 穴の上のブロックペナルティ
      }
    }
  }
  return penalty;
}
```

### 3. 多様化ビーム探索

#### 多様性メトリック
```typescript
function calculateSurfaceProfile(board: Uint32Array): number[] {
  const profile = new Array(10).fill(0);
  for (let col = 0; col < 10; col++) {
    for (let row = 19; row >= 0; row--) {
      if (board[row] & (1 << col)) {
        profile[col] = 20 - row;
        break;
      }
    }
  }
  return profile;
}

function profileDistance(profile1: number[], profile2: number[]): number {
  return profile1.reduce((sum, h1, i) => sum + Math.abs(h1 - profile2[i]), 0);
}
```

#### 選択アルゴリズム
```typescript
function selectDiversifiedNodes(nodes: BeamNode[], beamWidth: number): BeamNode[] {
  const half = Math.floor(beamWidth / 2);
  
  // 上位半分をスコア順で選択
  const topByScore = nodes
    .sort((a, b) => b.score - a.score)
    .slice(0, half);
  
  // 残り半分を多様性で選択
  const remaining = nodes.slice(half);
  const selectedProfiles = topByScore.map(n => calculateSurfaceProfile(n.board));
  
  const diverseNodes = [];
  for (const candidate of remaining) {
    const candidateProfile = calculateSurfaceProfile(candidate.board);
    const minDistance = Math.min(...selectedProfiles.map(p => 
      profileDistance(candidateProfile, p)
    ));
    candidate.diversityScore = minDistance;
  }
  
  diverseNodes.push(...remaining
    .sort((a, b) => b.diversityScore - a.diversityScore)
    .slice(0, beamWidth - half)
  );
  
  return [...topByScore, ...diverseNodes];
}
```

### 4. 開放パターン統合

#### Perfect Clear Opener (PCO)
```typescript
function detectPCO(board: Uint32Array, pieceSequence: TetrominoType[]): number {
  const blockCount = countBlocks(board);
  if (blockCount > 8) return 0;
  
  // 7-bag perfect clear pattern detection
  const expectedPCOSequence = ['Z', 'O', 'S', 'L', 'I', 'J', 'T'];
  const matchScore = calculateSequenceMatch(pieceSequence, expectedPCOSequence);
  
  return matchScore * 20; // PCOボーナス
}
```

#### T-Spin Setup Patterns
```typescript
function detectTSpinSetup(board: Uint32Array): number {
  let bonus = 0;
  
  // DT Cannon pattern
  if (detectDTCannonPattern(board)) bonus += 15;
  
  // ST-Stack pattern  
  if (detectSTStackPattern(board)) bonus += 12;
  
  // 3x2 T-Spin slots
  bonus += count3x2TSpinSlots(board) * 5;
  
  return bonus;
}
```

### 5. 実装ロードマップ

#### Phase 1: 基礎システム (1-2日)
- [ ] `src/game/ai/evaluators/new-weights.ts` 作成
- [ ] `weights.ts` の段階検出システム更新
- [ ] 基本テストケース作成

#### Phase 2: 評価要素拡張 (2-3日)
- [ ] `dellacherie.ts` に新評価要素追加
- [ ] `blocks_above_holes` 実装
- [ ] `well_open` 検出実装
- [ ] `escape_route` 分析実装

#### Phase 3: 探索多様化 (2-3日)
- [ ] `beam-search.ts` の多様化アルゴリズム実装
- [ ] 深度割引因子 (γ^d) 追加
- [ ] プロファイル多様性メトリック実装

#### Phase 4: パターン統合 (2-3日)
- [ ] `src/game/ai/evaluators/patterns.ts` 作成
- [ ] PCO パターン検出実装
- [ ] T-Spin セットアップパターン実装
- [ ] 開放戦略ボーナスシステム

#### Phase 5: 統合テスト & 調整 (2-3日)
- [ ] 包括的統合テスト
- [ ] 重みパラメータ調整
- [ ] パフォーマンス最適化
- [ ] 実戦テストとフィードバック

### 6. 期待される効果

#### 短期効果 (Phase 1-2完了後)
- ライン消去頻度の向上
- ゲーム生存時間の延長
- より安定した盤面管理

#### 中期効果 (Phase 3-4完了後)  
- 戦略的多様性の向上
- T-Spin等高度テクニックの活用
- 開放戦略による高スコア達成

#### 長期効果 (全Phase完了後)
- 人間プレイヤーレベルの戦略性
- 一貫したライン消去パフォーマンス
- アダプティブな難易度対応

## 技術的考慮事項

### パフォーマンス影響
- 新評価要素による計算量増加: 約15-20%
- 多様化探索による探索時間増加: 約10-15%
- 全体的なレスポンス性能への影響: 軽微

### コード品質保証
- 既存テストケースの継続実行
- 新機能ごとの段階的テスト追加
- TypeScript型安全性の維持
- 設定フラグによる機能切り替え対応

### 拡張性確保
- プラグイン式パターン追加システム
- 重みパラメータの動的調整機能
- ログ&分析システムとの統合
- 将来的な機械学習統合への準備

## 結論

本改善計画は、現在のTetris AIの技術的優位性を活かしつつ、戦略的弱点を体系的に解決するアプローチである。O3による戦略分析とGeminiによる実装指針を統合し、段階的かつ確実な改善を実現する。

特に重要なのは、「短期最適化の罠」から脱却し、段階的戦略思考を導入することで、AIがライン消去を自然に実行し、長期生存を実現することである。

この計画の実行により、現在のAIは技術的優秀性と戦略的知性を兼ね備えた、真に競争力のあるTetris AIへと進化することが期待される。

---
**作成日**: 2025-07-07  
**作成者**: Claude & 専門AI協議会（O3, Gemini）  
**ステータス**: 実装準備完了