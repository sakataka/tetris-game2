# 機能追加計画

> **現状評価**: ゲーム性8/10点、UI/UX9/10点
> 
> 基本的なテトリス体験は完成されているが、以下の機能追加でより本格的で魅力的なゲームに発展可能です。

## 優先度別機能追加項目

### 🔴 高優先度（必須実装 - ゲーム体験の大幅向上）

#### 1. ホールド機能の実装
- **おすすめ度**: 9/10
- **実装判断**: ✅ **やる**
- **工数**: 中（4-6時間）

**機能詳細**:
任意のタイミングでピースを「保持」し、一度だけストックしたピースと入れ替え可能。現代テトリスの標準機能。

**現在のコードベース**:
- ピース管理: `src/game/game.ts` (currentPiece, nextPiece)
- UI構造: `src/components/game/NextPiece.tsx`（流用可能）
- 状態管理: `src/store/gameStore.ts`

**追加が必要な実装**:
```typescript
// types/game.ts に追加
interface GameState {
  heldPiece: TetrominoTypeName | null;
  canHold: boolean; // ワンロック制御（1配置につき1回まで）
}

// store/gameStore.ts に追加
holdPiece: () => void;
```

**実装手順**:
1. ゲーム状態にheldPiece, canHoldを追加
2. holdPiece関数をgameStoreに実装（ピース交換ロジック）
3. HoldPiece.tsx作成（NextPiece.tsxを複製）
4. Shift キーでhold操作（useKeyboardControls.ts）
5. 国際化対応（locales/ja.json, en.json）
6. テストケース追加

**影響ファイル**:
- 状態: `src/types/game.ts`, `src/store/gameStore.ts`
- UI: `src/components/game/HoldPiece.tsx`（新規）, `src/components/layout/Game.tsx`
- 操作: `src/hooks/useKeyboardControls.ts`

#### 2. 壁蹴り回転（回転補正）の導入
- **おすすめ度**: 9/10
- **実装判断**: ✅ **やる**
- **工数**: 大（8-12時間）

**機能詳細**:
スーパー回転システム(SRS)による壁際・接地間際での回転補正。回転できない場合に複数の代替位置を試行。

**現在のコードベース**:
- 回転処理: `src/game/tetrominos.ts` (rotateTetromino)
- 衝突判定: `src/game/board.ts` (isValidPosition)
- 回転統合: `src/game/game.ts` (rotateTetrominoCW)

**追加が必要な実装**:
```typescript
// 新規ファイル: game/wallKick.ts
interface WallKickData {
  [pieceType: string]: {
    [rotation: string]: Position[]; // 補正候補位置
  }
}

const SRS_WALL_KICK_DATA: WallKickData = {
  "JLSTZ": { "0->1": [{x:0,y:0}, {x:-1,y:0}, {x:-1,y:1}, ...] },
  "I": { "0->1": [{x:0,y:0}, {x:-2,y:0}, {x:1,y:0}, ...] }
};
```

**実装手順**:
1. SRS壁蹴りデータテーブル作成（game/wallKick.ts）
2. 回転補正関数の実装（複数候補位置の試行）
3. rotateTetrominoCW関数の拡張（壁蹴り対応）
4. ピース別ロジック（I/O/JLSTZ）の実装
5. 既存テストの更新と新規テスト追加

**技術的複雑さ**: 
- SRSの標準ルールは複雑（ピース種別×回転状態の組み合わせ）
- Tスピン実現の前提条件としても重要

**影響ファイル**:
- ロジック: `src/game/tetrominos.ts`, `src/game/game.ts`, `src/game/wallKick.ts`（新規）
- テスト: `src/game/tetrominos.test.ts`

#### 3. サウンドエフェクトとBGMの追加
- **おすすめ度**: 8/10
- **実装判断**: ✅ **やる**
- **工数**: 中（6-8時間、音源制作含む）

**機能詳細**:
ライン消去時の効果音、ゲーム中BGM、各種操作音。既存の音量設定を活用。

**現在のコードベース**:
- 音量設定: `src/utils/localStorage.ts` (GameSettings.volume)（既存）
- イベント処理: `src/store/gameStore.ts`の各アクション
- アニメーション: `src/hooks/useAnimationCompletionHandler.ts`

**追加が必要な実装**:
```typescript
// 新規ファイル: utils/audio.ts
interface AudioManager {
  playSound: (event: 'move' | 'rotate' | 'drop' | 'lineClear' | 'tetris') => void;
  setVolume: (volume: number) => void;
  mute: () => void;
}
```

**実装手順**:
1. 音声ファイル準備（public/sounds/）
2. AudioManagerクラス作成（Web Audio API使用）
3. 各gameStoreアクションに音声再生を追加
4. 音量設定UI（既存のlocalStorage.volume活用）
5. 音声のプリロードとキャッシュ

**音声イベント**:
- move/rotate: 操作音
- drop: ハードドロップ音
- lineClear: ライン消去音（1-3ライン）
- tetris: 4ライン同時消去音

**影響ファイル**:
- 音声: `src/utils/audio.ts`（新規）, `public/sounds/`（新規）
- 状態: `src/store/gameStore.ts`（音声再生追加）
- UI: 音量設定コンポーネント（新規）

#### 4. 7-Bag方式のランダム生成
- **おすすめ度**: 8/10
- **実装判断**: ✅ **やる**
- **工数**: 小（2-3時間）

**機能詳細**:
7種類のピースを重複なく一巡りさせるランダム生成方式。ピース出現の偏りを防ぎ公平性を向上。

**現在のコードベース**:
- ランダム生成: `src/game/tetrominos.ts` (getRandomTetrominoType)
- 定数定義: `src/utils/constants.ts` (TETROMINO_TYPES)
- 状態管理: `src/game/game.ts` (createInitialGameState)

**追加が必要な実装**:
```typescript
// types/game.ts に追加
interface GameState {
  pieceBag: TetrominoTypeName[]; // 7-Bagの現在の袋
}

// 新規: game/pieceBag.ts
class PieceBagManager {
  private bag: TetrominoTypeName[] = [];
  
  getNextPiece(): TetrominoTypeName {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }
  
  private refillBag(): void {
    this.bag = [...TETROMINO_TYPES];
    this.shuffle(this.bag);
  }
}
```

**実装手順**:
1. PieceBagManagerクラス作成（game/pieceBag.ts）
2. ゲーム状態にpieceBag配列追加
3. getRandomTetrominoType廃止、pieceBag使用に変更
4. ゲーム初期化・リセット時の袋初期化
5. 既存テストの更新

**技術的複雑さ**: 最も低い（シンプルなアルゴリズム）

**影響ファイル**:
- ロジック: `src/game/pieceBag.ts`（新規）, `src/game/tetrominos.ts`, `src/game/game.ts`
- 状態: `src/types/game.ts`, `src/store/gameStore.ts`

### 🟡 中優先度（推奨実装 - ゲーム性拡張）

#### 5. Tスピン判定とボーナス得点
- **おすすめ度**: 7/10
- **実装判断**: ⚠️ **条件付きでやる**
- **詳細**: T字ブロックの壁ねじ込み技術の検出とボーナス得点付与
- **ユーザー価値**: 上級者向け要素、スコアリング深化
- **技術的複雑さ**: 高（Tスピン条件判定、複雑なルール）
- **工数**: 大（10-15時間）
- **実装条件**: 壁蹴り回転実装後、上級者プレイヤーからの要望がある場合
- **実装要素**: 3-corner-rule判定、Mini/Single/Double/Triple判別

#### 6. コンボシステムの導入
- **おすすめ度**: 6/10
- **実装判断**: ✅ **やる**
- **詳細**: 連続ライン消去時の追加得点システム
- **ユーザー価値**: 爽快感向上、戦略的プレイの促進
- **技術的複雑さ**: 低（スコア計算への乗算追加）
- **工数**: 小（2-3時間）
- **実装要素**: コンボカウンター、得点計算式、UI表示

#### 7. 追加ゲームモード
- **おすすめ度**: 6/10
- **実装判断**: ⚠️ **段階的にやる**
- **詳細**: Sprint（40ライン消去タイムアタック）、固定レベルスタート等
- **ユーザー価値**: リプレイ性向上、多様なチャレンジ
- **技術的複雑さ**: 中（モード切替、終了条件の変更）
- **工数**: 中（各モード3-5時間）
- **実装順序**: 1) Sprint mode → 2) Level Select → 3) Time Attack
- **実装要素**: モード選択UI、各モード専用ロジック

### 🟢 低優先度（将来的に検討）

#### 8. オンラインランキング
- **おすすめ度**: 5/10
- **実装判断**: ❌ **やらない**
- **詳細**: サーバーサイドでのスコア管理・リーダーボード
- **理由**: サーバー運用コスト、セキュリティ考慮、開発工数大
- **代替案**: ローカルハイスコアの充実（統計情報、プレイ履歴）

#### 9. キーコンフィグと操作設定
- **おすすめ度**: 4/10
- **実装判断**: ⚠️ **ユーザー要望次第**
- **詳細**: キー割当変更、スワイプ感度調整、各種設定
- **ユーザー価値**: カスタマイズ性向上、個人最適化
- **技術的複雑さ**: 中（設定保存、入力処理の動的変更）
- **工数**: 中（5-7時間）
- **実装条件**: ユーザーから操作改善の要望がある場合

#### 10. 対戦・マルチプレイヤーモード
- **おすすめ度**: 3/10
- **実装判断**: ❌ **やらない**
- **詳細**: リアルタイム対戦、お邪魔ブロック送信
- **理由**: 実装難易度が極めて高い、ネットワーク同期・バランス調整が複雑
- **代替案**: 将来的な大規模拡張時に検討

## 実装ロードマップ

### 推奨実装順序（難易度・効果を考慮）

**Phase 1: 基盤機能（Week 1-2）**
1. **7-Bag方式のランダム生成**（2-3時間）
   - 最低難易度、高効果
   - 他機能への依存なし
   - テストの公平性向上

**Phase 2: コア機能（Week 3-6）**  
2. **ホールド機能の実装**（4-6時間）
   - 中難易度、最高効果
   - UIとロジックの統合が必要
   - 戦略性の大幅向上

**Phase 3: 高度機能（Week 7-12）**
3. **サウンドエフェクトとBGM**（6-8時間）
   - 中難易度、高効果  
   - 既存のvolume設定活用
   - 臨場感の大幅向上

4. **壁蹴り回転の導入**（8-12時間）
   - 最高難易度、最高効果
   - SRSアルゴリズムの複雑性
   - Tスピン実現の前提条件

### Version 1.1: コアゲーム機能強化（2-3ヶ月）
実装完了後、以下の中優先度機能を検討：

### Version 1.2: ゲーム性拡張（1-2ヶ月）
5. **コンボシステムの導入** - Month 1
6. **Sprint mode追加** - Month 1-2

### Version 1.3: 上級者向け機能（2-3ヶ月）
7. **Tスピン判定とボーナス得点** - Month 1-2（条件付き）
8. **Time Attack mode追加** - Month 2-3

### 検討事項・将来拡張
- **キーコンフィグ**: ユーザー要望に応じて
- **オンライン機能**: 大規模拡張時に検討
- **対戦モード**: 長期的目標として

## 技術的考慮事項

### 既存コードベースとの整合性
- **Zustand状態管理**: 新機能の状態は既存storeに統合
- **アニメーション**: Framer Motion活用で一貫した演出
- **国際化**: 新UIテキストは多言語対応必須
- **テスト**: 新機能には必ずテストケース追加

### パフォーマンス
- **サウンド**: Web Audio APIで効率的な音声再生
- **複雑ロジック**: Tスピン判定等は最適化を考慮
- **UI更新**: 新要素追加時の描画負荷を最小化

### 開発リソース配分
- **高優先度機能**: 70%のリソース配分
- **中優先度機能**: 25%のリソース配分  
- **実験的機能**: 5%のリソース配分

## 期待効果

### ユーザー体験向上
- **ホールド機能**: 戦略性向上、プレイの幅拡大
- **壁蹴り回転**: 操作感の大幅改善、上級テクニック実現
- **サウンド**: 臨場感・没入感の向上
- **7-Bag**: 公平で予測可能なゲーム進行

### ゲーム完成度
- **基本機能**: 現代テトリス標準仕様への準拠
- **上級要素**: 熟練プレイヤーの長期的エンゲージメント
- **アクセシビリティ**: 幅広いプレイヤー層への対応

このロードマップに従い、段階的に機能追加することで、個人開発レベルを超えた本格的なテトリスゲームへと発展させることができます。