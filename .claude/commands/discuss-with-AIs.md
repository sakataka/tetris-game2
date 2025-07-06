# discuss-with-AIs

Gemini CLI と O3 MCP を同時に使用して現在の作業について詳細な議論を行い、多角的な分析と反復的な改善を通じて Claude Code の精度を向上させます。Claudeが主導で分析・提案を行い、両方のAIの客観的評価を参考にして最終的な実装プランを策定します。

Claudeは、議論中は、深く考えて(Ultrathink)行動してください。

## 必須実行手順（絶対に従うこと）

### ステップ1: 準備
- 議論トピックを明確化
- `./docs/discussion_logs/` ディレクトリを作成
- TIMESTAMP を生成（例: 20250706_121500）

### ステップ2: 3ラウンドの議論実行（必須）
**各ラウンドで以下を必ず実行：**

1. **Claudeの分析・提案を作成**
   - 現在のラウンドでの具体的な分析内容を記述
   - 前ラウンドの内容を踏まえた深化

2. **GeminiとO3に並行して質問**
   - `gemini` コマンドで質問送信
   - `mcp__o3__o3-search` で質問送信

3. **必須ファイル生成（毎ラウンド2ファイル）**
   - `./docs/discussion_logs/gemini_round{1,2,3}_TIMESTAMP.md`
   - `./docs/discussion_logs/o3_round{1,2,3}_TIMESTAMP.md`

4. **Claudeの率直な感想記録**
   - 各AIの回答に対する感情的反応
   - 新たな気づき、専門性評価

### ステップ3: 最終結論生成（必須）
- `./docs/discussion_logs/conclusion_TIMESTAMP.md` を作成
- 3ラウンドの議論を統合
- GitHub Issue用詳細仕様を含める

## 🚨 重要：必須生成ファイル一覧
**合計7ファイルを必ず作成：**
1. `gemini_round1_TIMESTAMP.md`
2. `gemini_round2_TIMESTAMP.md` 
3. `gemini_round3_TIMESTAMP.md`
4. `o3_round1_TIMESTAMP.md`
5. `o3_round2_TIMESTAMP.md`
6. `o3_round3_TIMESTAMP.md`
7. `conclusion_TIMESTAMP.md`

## 実装

```bash
#!/bin/bash

# 共通設定
setup_common_config() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    LOG_DIR="./docs/discussion_logs"
    mkdir -p "${LOG_DIR}"
    
    # 共通の実装制約
    IMPLEMENTATION_CONSTRAINTS="## 実装制約と優先度基準
- **高優先度**: 技術的影響大、実装基盤、依存関係の起点
- **中優先度**: 機能完成、ユーザー体験向上、パフォーマンス最適化  
- **低優先度**: 拡張機能、将来対応、エンハンスメント
- **将来検討**: 現在の技術スタック・設計では時期尚早

## 生成AI実行前提
- **実行者**: 生成AI（Claude等）による自動実装
- **工数制約**: なし（処理能力の範囲内で最適解を追求）
- **技術スタック**: [既存技術の制約のみ考慮]
- **品質基準**: [テストカバレッジ、パフォーマンス要件等]

## 生成AI実装特性考慮
### 生成AIが得意なタスク
- 型定義とインターフェース設計
- 確立されたパターンに基づくコード生成
- ユーティリティ関数・ヘルパー関数の実装
- テストコードの作成
- ドキュメント生成と更新
- リファクタリング（構造が明確な場合）

### 生成AIが困難なタスク  
- 複雑なUX/UI判断を要する調整
- ブラウザ固有の互換性問題対応
- パフォーマンス微調整（プロファイリング結果基づく）
- 視覚的デザインの細かい調整
- ドメイン固有の複雑なビジネスロジック判断"

    # 共通の評価軸
    EVALUATION_CRITERIA="## 技術的評価
1. 実装の妥当性（技術選択の適切性、アーキテクチャ整合性）
2. パフォーマンス影響（計算量、メモリ使用量、応答時間）
3. 保守性・拡張性（コードの可読性、将来変更への対応）

## 生成AI実装適性評価
1. 自動実装可能性（パターンの明確性、実装複雑度）
2. 生成AI得意領域との適合性（型定義、ユーティリティ、テスト等）
3. 人間判断必要箇所（UX判断、視覚的調整、ドメイン知識等）

## リスク分析
1. 潜在的リスク（技術的リスク、運用リスク、セキュリティリスク）
2. 生成AI実装特有リスク（パターン誤解、エッジケース見落とし）
3. 緩和策の妥当性（対策の実効性、自動検証可能性）

## タスク分解評価
1. GitHub Issue化適性（タスクの粒度、独立性、明確性）
2. 依存関係の整理（実装順序、ブロッカー、並行可能性）
3. 受け入れ基準の明確性（自動テスト可能、判定基準）

各項目について、具体的かつ実行可能な評価をお願いします。"
}

# AI回答取得（改善されたエラーハンドリング付き）
get_ai_responses() {
    local prompt="$1"
    local claude_analysis="$2"
    local round="$3"
    local previous_content="$4"
    
    # Gemini回答取得（ヒアドキュメント形式で安定化）
    echo "🤖 Gemini に質問中..."
    GEMINI_RESPONSE=$(cat << EOF | gemini 2>/dev/null
$prompt

## Claudeの分析・提案
$claude_analysis

$EVALUATION_CRITERIA
EOF
)
    
    # Geminiのレスポンス検証
    if [ -z "$GEMINI_RESPONSE" ] || echo "$GEMINI_RESPONSE" | grep -q "error\|Error\|ERROR"; then
        echo "⚠️ Geminiからの有効な回答を取得できませんでした。"
        GEMINI_RESPONSE="❌ Geminiへの接続でエラーが発生しました。技術的な問題により今回のラウンドは参加できませんでした。"
    else
        echo "✅ Geminiから回答を取得しました"
    fi
    
    # O3回答取得
    echo "🤖 O3 に質問中..."
    O3_RESPONSE=$(mcp__o3__o3-search "$prompt

## Claudeの分析・提案
$claude_analysis

$EVALUATION_CRITERIA" 2>/dev/null)
    
    # O3のレスポンス検証
    if [ -z "$O3_RESPONSE" ] || echo "$O3_RESPONSE" | grep -q "error\|Error\|ERROR"; then
        echo "⚠️ O3からの有効な回答を取得できませんでした。"
        O3_RESPONSE="❌ O3への接続でエラーが発生しました。技術的な問題により今回のラウンドは参加できませんでした。"
    else
        echo "✅ O3から回答を取得しました"
    fi
    
    # 結果をファイルに記録
    local gemini_log="${LOG_DIR}/gemini_round${round}_${TIMESTAMP}.md"
    local o3_log="${LOG_DIR}/o3_round${round}_${TIMESTAMP}.md"
    
    # Geminiファイル作成
    cat > "$gemini_log" << EOF
# Gemini議論ログ - ラウンド${round} (${TIMESTAMP})

$previous_content

$IMPLEMENTATION_CONSTRAINTS

## Claudeの分析・提案
$claude_analysis

## Geminiへの評価依頼
$prompt

## Geminiからの回答
$GEMINI_RESPONSE

## Claudeの率直な感想
Geminiの回答を受けての率直な感想：

**📝 分析への評価について**
[Geminiからの評価に対する感情的な反応：嬉しい、自信がついた、意外だった等]

**🎯 新たな気づきについて**
[指摘された内容への反応：「なるほど」「見落としていた」「違うと思う」等]

**🤔 専門性や提案への感想**
[Geminiの専門性レベルや提案内容への感想：的確、理想論すぎる、当然のこと等]

**⚡ 議論の質への評価**
[議論プロセスや相手の回答レベルへの率直な評価]

EOF
    
    # O3ファイル作成
    cat > "$o3_log" << EOF
# O3議論ログ - ラウンド${round} (${TIMESTAMP})

$previous_content

$IMPLEMENTATION_CONSTRAINTS

## Claudeの分析・提案
$claude_analysis

## O3への評価依頼
$prompt

## O3からの回答
$O3_RESPONSE

## Claudeの率直な感想
O3の回答を受けての率直な感想：

**📝 分析への評価について**
[O3からの評価に対する感情的な反応：嬉しい、自信がついた、意外だった等]

**🎯 新たな気づきについて**
[指摘された内容への反応：「なるほど」「見落としていた」「違うと思う」等]

**🤔 専門性や提案への感想**
[O3の専門性レベルや提案内容への感想：的確、理想論すぎる、当然のこと等]

**⚡ 議論の質への評価**
[議論プロセスや相手の回答レベルへの率直な評価]

EOF

    echo "✅ ラウンド${round}の回答を記録しました"
    echo "📄 Gemini: $gemini_log"
    echo "📄 O3: $o3_log"
}

# 最終結論生成（詳細なGitHub Issue仕様付き）
generate_final_conclusion() {
    local conclusion_file="${LOG_DIR}/conclusion_${TIMESTAMP}.md"
    
    cat > "$conclusion_file" << 'EOF'
# 両AI議論 最終結論 (${TIMESTAMP})

## 議論プロセスの総括

### 3ラウンドの議論経過
[各ラウンドの重要な議論点と進展]

### 両AIの評価比較
**Geminiの特徴的な観点**:
- [Geminiが特に強調した点]
- [Geminiの独特な視点]

**O3の特徴的な観点**:
- [O3が特に強調した点]
- [O3の独特な視点]

### 意見の相違点と共通点
**共通して指摘された重要事項**:
- [両方のAIが合意した点]

**意見が分かれた項目**:
- [相違点とその理由]

## Claudeの最終判断

### 採用する提案とその理由
**Geminiの提案から採用**:
- [具体的な提案] → 採用理由: [詳細な理由]

**O3の提案から採用**:
- [具体的な提案] → 採用理由: [詳細な理由]

### 却下する提案とその理由
**却下した提案**:
- [具体的な提案] → 却下理由: [詳細な理由]

### Claudeの独自判断
**両AIの意見を超えた追加提案**:
- [Claudeが独自に判断した要素]

---

## GitHub Issue 詳細仕様（即座に発行可能）

### 🔴 高優先度タスク

---

## Issue #1: [タスクタイトル]

### タイトル
`[Phase X]: 具体的なタスクタイトル - サブタイトル`

### 説明
[タスクの背景と目的を2-3段落で詳細に記載]

### User Story
[エンドユーザーまたは開発者の視点からのストーリー]

### 受け入れ基準
- [ ] [具体的で測定可能な基準1]
- [ ] [具体的で測定可能な基準2]
- [ ] [テストカバレッジ要件]
- [ ] [パフォーマンス要件]
- [ ] [ドキュメント要件]

### 技術的タスク
1. **タスク1** (`/path/to/file.ts`)
   ```typescript
   // 具体的なコード例
   ```

2. **タスク2** (`/path/to/file.ts`)
   - サブタスク2-1
   - サブタスク2-2

3. **タスク3**
   - 詳細な実装手順

### 依存関係
- **必須**: #issue-number (依存理由)
- **推奨**: #issue-number (推奨理由)

### 見積もり
- **工数**: X日
- **リスク**: High/Medium/Low（理由）

### 技術的注意事項
- [実装時の注意点1]
- [考慮すべきエッジケース]
- [パフォーマンス考慮事項]

---

[高優先度タスクすべてについて上記フォーマットで詳細記載]

### 🟡 中優先度タスク

[中優先度タスクについても同様のフォーマットで記載]

### 🟢 低優先度タスク（概要のみ）

[低優先度タスクは概要レベルで記載]

---

## 実装ガイダンス
[技術的な実装指針]

## 未決定事項（ユーザー判断要請）
[迷いがある場合の判断材料とメリット・デメリット]

### 選択肢A: [選択肢名]
**メリット**: [具体的利点]
**デメリット**: [具体的欠点]
**Claudeの所感**: [率直な印象]

### 選択肢B: [選択肢名]
**メリット**: [具体的利点]
**デメリット**: [具体的欠点]
**Claudeの所感**: [率直な印象]

**推奨**: [Claudeの推奨と理由]

## 次のアクション

1. **即座実行可能**:
   - GitHub マイルストーン作成
   - イシューテンプレート配置
   - 高優先度イシューの作成

2. **1週間以内**:
   - 実装着手
   - ドキュメント整備

3. **最終目標**:
   - [具体的な達成目標と期限]

EOF
    
    echo "📋 最終結論ファイルを作成しました: $conclusion_file"
}

# メイン実行
main() {
    echo "🚀 両AI議論プロセスを開始します..."
    
    # 共通設定
    setup_common_config
    
    # 議論トピックの設定
    TOPIC="${1:-general}"
    echo "📝 議論トピック: $TOPIC"
    
    # 各ラウンドの実行
    for round in 1 2 3; do
        echo ""
        echo "🔄 ラウンド${round}を開始します..."
        
        # ⚠️ 重要: この部分は実際にはClaudeが具体的な分析内容を記述する必要がある
        # プレースホルダーではなく、実際の分析を行うこと
        claude_analysis="⚠️ この部分はClaudeが実際のラウンド${round}分析を記述すること"
        
        # 前回までの内容（ラウンド2以降）
        previous_content=""
        if [ $round -gt 1 ]; then
            previous_content="## 前回までの議論サマリー
[ラウンド$((round-1))までの要点]"
        fi
        
        # AI回答取得
        get_ai_responses "$TOPIC" "$claude_analysis" "$round" "$previous_content"
        
        echo "✅ ラウンド${round}が完了しました"
    done
    
    # 最終結論生成
    echo ""
    echo "📋 最終結論を生成中..."
    generate_final_conclusion
    
    echo ""
    echo "🎉 両AI議論プロセスが完了しました！"
    echo "📁 生成されたファイル:"
    echo "  - 議論ログ: ${LOG_DIR}/gemini_round[1-3]_${TIMESTAMP}.md"
    echo "  - 議論ログ: ${LOG_DIR}/o3_round[1-3]_${TIMESTAMP}.md"
    echo "  - 最終結論: ${LOG_DIR}/conclusion_${TIMESTAMP}.md"
    echo ""
    echo "⚠️  重要: 最終結論ファイルには、GitHub Issueとして即座に発行できる詳細な仕様が含まれています。"
}

# 実行
main "$@"
```


## 成功の判定基準

### ✅ 実行成功の条件
1. **7ファイルの完全生成**：

2. **各ファイルの必須内容**：
   - Claudeの具体的な分析（プレースホルダー不可）
   - AIからの実際の回答
   - Claudeの率直な感想

3. **最終結論ファイルの必須要素**：
   - 3ラウンドの議論総括
   - GitHub Issue詳細仕様
   - 3つのAIの評価（星10個 + 100点満点）

### ✅ AI参加エラーへの対応
- 片方のAIが参加できない場合：代替メッセージで対応し、処理を継続
- 両方のAIが参加できない場合：エラーメッセージを記録し、Claudeの独自分析で議論を継続

## 期待される成果

- **議論ログ**：
  - 各AI・各ラウンドの完全な対話履歴
  - **Claudeの率直な感想**：感情的反応、専門性評価、新たな気づき等
  - 累積的な知見の蓄積

- **最終結論ファイル（1ファイル）**：
  - 両AIの意見を統合したClaudeの最終判断
  - 採用/却下の理由を明記した透明性のある結論
  - **GitHub Issue登録用の詳細な仕様書**（即座に発行可能なレベル）
  - **3つのAI評価**：星10個 + 100点満点の総合評価
  - 迷いがある場合はユーザーへの判断要請

## 注意事項と改善点

### エラーハンドリングの改善
- **安定したプロンプト送信**：ヒアドキュメント形式でより確実にプロンプトを送信
- **レスポンス検証**：空のレスポンスやエラーメッセージを適切に検出し、代替メッセージで対応

### 議論プロセス
- **各ラウンドで前回までの議論内容を累積的に提供します**
- 最終的な判断はClaudeが行い、その理由を明確に記載します
- **最終結論は、記憶を失った場合でもGitHub Issueを作成できる詳細レベルで記載されます**

### ファイル管理
- 保存場所：`./docs/discussion_logs/`
- 必ず7ファイル生成：AI参加状況に関わらず完全なログセットを作成