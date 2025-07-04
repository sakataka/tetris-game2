# discuss-with-gemini

Gemini CLI を使用して現在の作業について詳細な議論を行い、多角的な分析と反復的な改善を通じて Claude Code の精度を向上させます。Claudeが主導で分析・提案を行い、Geminiの客観的評価を参考にして最終的な実装プランを策定します。

## オプション

### 議論の方向性制御
```bash
/discuss-with-gemini --focus technical    # 技術的分析重視
/discuss-with-gemini --focus strategic   # 戦略・アーキテクチャ重視  
/discuss-with-gemini --focus tactical    # 実装・実行計画重視
/discuss-with-gemini --focus holistic    # 包括的（デフォルト）
```

### 専門領域特化
```bash
/discuss-with-gemini --domain performance   # パフォーマンス分析特化
/discuss-with-gemini --domain architecture  # アーキテクチャ設計特化
/discuss-with-gemini --domain security      # セキュリティ分析特化
/discuss-with-gemini --domain testing       # テスト戦略特化
```

## 実行手順

1. **現在のコンテキストの収集**
   まず、現在の作業に関する情報を収集します：
   ```bash
   # Git状態と最近の変更を確認
   git status --porcelain
   git diff --cached
   git diff
   git log --oneline -10
   ```

2. **実装制約と議論トピックの準備**
   コンテキストに基づいて、実装制約を明確化し議論ポイントを準備します。
   
   **関連する過去議論の検索**（ナレッジベース機能）：
   ```bash
   # 類似テーマの過去議論を自動検索
   find ./docs/discussion_logs -name "*.md" -exec grep -l "パフォーマンス最適化\|アニメーション" {} \;
   # 発見された関連議論の要点を参照し、今回の議論に反映
   ```
   
   ### 実装制約と優先度基準
   ```
   ## 実装制約と優先度基準
   - **高優先度**: 技術的影響大、実装基盤、依存関係の起点
   - **中優先度**: 機能完成、ユーザー体験向上、パフォーマンス最適化  
   - **低優先度**: 拡張機能、将来対応、エンハンスメント
   - **将来検討**: 現在の技術スタック・設計では時期尚早

   ## 生成AI実行前提
   - **実行者**: 生成AI（Claude/GPT等）による自動実装
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
   - ドメイン固有の複雑なビジネスロジック判断
   ```
   
   ### 議論ポイント
   - アーキテクチャとデザインパターン
   - パフォーマンスとスケーラビリティ
   - 保守性とコード品質
   - セキュリティ考慮事項
   - ベストプラクティスの整合性

3. **3ラウンドの累積的議論プロセス**
   
   Claude主導で各ラウンドを実行し、Geminiの客観的評価を参考にして段階的に議論を深化させます：

   ### ラウンド1: 初期分析と課題特定（Claude主導）
   ```bash
   # タイムスタンプの生成
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   
   # ラウンド1のログファイルを作成
   ROUND1_LOG="./docs/discussion_logs/gemini_discussion_round1_${TIMESTAMP}.md"
   
   # 議論の進展状況マップを初期化
   echo "# Gemini議論ログ - ラウンド1 (${TIMESTAMP})" > "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## 議論の進展状況" >> "${ROUND1_LOG}"
   echo "### ✅ 確定事項" >> "${ROUND1_LOG}"
   echo "- (初期状態)" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "### 🔄 議論中" >> "${ROUND1_LOG}"
   echo "- 初期分析の妥当性" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "### ❓ 未解決" >> "${ROUND1_LOG}"
   echo "- 実装戦略" >> "${ROUND1_LOG}"
   echo "- リスク評価" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## 実装制約と優先度基準" >> "${ROUND1_LOG}"
   echo "[プロジェクトの制約条件と実装優先度基準]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## Claudeの初期分析" >> "${ROUND1_LOG}"
   echo "[必要なファイル読み込み・調査を含む包括的分析]" >> "${ROUND1_LOG}"
   echo "[技術的課題の特定と改善案の提示]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## Geminiへの評価依頼" >> "${ROUND1_LOG}"
   echo "[Claudeの分析に対する客観的評価依頼]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   
   # 構造化プロンプトによるGeminiとの対話
   FOCUS_AREA=${1:-holistic}  # デフォルトは包括的分析
   DOMAIN_AREA=${2:-general}  # デフォルトは汎用分析
   
   # 専門領域別のプロンプト拡張
   DOMAIN_PROMPT=""
   case $DOMAIN_AREA in
     performance) DOMAIN_PROMPT="パフォーマンス専門家として、ボトルネック分析と最適化戦略に特に注意して評価してください。" ;;
     architecture) DOMAIN_PROMPT="ソフトウェアアーキテクトとして、設計の妥当性と拡張性に特に注意して評価してください。" ;;
     security) DOMAIN_PROMPT="セキュリティ専門家として、潜在的な脆弱性と対策に特に注意して評価してください。" ;;
     testing) DOMAIN_PROMPT="テスト専門家として、テスト戦略と品質保証に特に注意して評価してください。" ;;
   esac
   
   GEMINI_RESPONSE=$(gemini <<EOF
   # 専門領域指定
   ${DOMAIN_PROMPT}
   
   # 実装制約と優先度基準
   [上記で設定した制約条件]
   
   # Claudeの分析内容
   [Claudeによる技術分析と改善提案]
   
   上記のClaudeの分析について、生成AI実装前提で以下の構造化された評価軸から客観的な評価をお願いします：
   
   ## 技術的評価
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
   
   各項目について、具体的かつ実行可能な評価をお願いします。
   EOF
   )
   
   # Geminiの回答を記録
   echo "## Geminiからの回答" >> "${ROUND1_LOG}"
   echo "${GEMINI_RESPONSE}" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## Claudeの率直な感想" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "Geminiの回答を受けての率直な感想：" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "**📝 分析への評価について**" >> "${ROUND1_LOG}"
   echo "[Geminiからの評価に対する感情的な反応：嬉しい、自信がついた、意外だった等]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "**🎯 新たな気づきについて**" >> "${ROUND1_LOG}"
   echo "[指摘された内容への反応：「なるほど」「見落としていた」「違うと思う」等]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "**🤔 専門性や提案への感想**" >> "${ROUND1_LOG}"
   echo "[Geminiの専門性レベルや提案内容への感想：的確、理想論すぎる、当然のこと等]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "**⚡ 議論の質への評価**" >> "${ROUND1_LOG}"
   echo "[議論プロセスや相手の回答レベルへの率直な評価]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## Claudeの統合分析" >> "${ROUND1_LOG}"
   echo "[Geminiの評価を踏まえた分析の調整・補強]" >> "${ROUND1_LOG}"
   echo "[次ラウンドで検討すべき重点領域の特定]" >> "${ROUND1_LOG}"
   echo "" >> "${ROUND1_LOG}"
   echo "## 議論品質メトリクス（ラウンド1）" >> "${ROUND1_LOG}"
   echo "- 論点網羅性: ⭐⭐⭐⭐⭐ (主要論点の特定完了)" >> "${ROUND1_LOG}"
   echo "- 分析深度: ⭐⭐⭐⚪⚪ (表面分析から詳細分析へ)" >> "${ROUND1_LOG}"
   echo "- 合意形成: ⭐⭐⚪⚪⚪ (方向性の確認段階)" >> "${ROUND1_LOG}"
   echo "- 実行可能性: ⭐⭐⚪⚪⚪ (概念から具体化へ)" >> "${ROUND1_LOG}"
   echo "- リスク分析: ⭐⭐⭐⚪⚪ (主要リスク特定済み)" >> "${ROUND1_LOG}"
   ```

   ### ラウンド2: 実装戦略とリスク評価（Claude提案 + Gemini評価）
   ```bash
   # ラウンド2のログファイルを作成
   ROUND2_LOG="./docs/discussion_logs/gemini_discussion_round2_${TIMESTAMP}.md"
   
   # 前回の議論内容を含めて記録
   echo "# Gemini議論ログ - ラウンド2 (${TIMESTAMP})" > "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## 議論の進展状況（ラウンド2開始時点）" >> "${ROUND2_LOG}"
   echo "### ✅ 確定事項" >> "${ROUND2_LOG}"
   echo "- [ラウンド1で合意に至った項目]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "### 🔄 議論中" >> "${ROUND2_LOG}"
   echo "- [現在検討中の項目]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "### ❓ 未解決" >> "${ROUND2_LOG}"
   echo "- [まだ議論していない重要項目]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "### 📋 今回の焦点" >> "${ROUND2_LOG}"
   echo "- [ラウンド2で重点的に議論する項目]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## 前回までの議論サマリー" >> "${ROUND2_LOG}"
   echo "[ラウンド1の要点]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## Claudeの実装戦略提案" >> "${ROUND2_LOG}"
   echo "[ラウンド1の分析を基にした具体的実装プラン]" >> "${ROUND2_LOG}"
   echo "[段階的実装アプローチとマイルストーン]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   
   # ラウンド1の内容を含めてGeminiに質問
   GEMINI_RESPONSE=$(gemini <<EOF
   # 前回の議論内容
   $(cat "${ROUND1_LOG}")
   
   # 今回の評価依頼
   前回の議論とClaudeの実装戦略について、以下の観点から評価してください：
   1. 実装プランの実現可能性
   2. 潜在的なリスクと緩和策
   3. パフォーマンス・保守性への影響
   4. より良い代替案の可能性
   EOF
   )
   
   # 回答を記録
   echo "## Geminiからの回答" >> "${ROUND2_LOG}"
   echo "${GEMINI_RESPONSE}" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## Claudeの率直な感想" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "Geminiの回答を受けての率直な感想：" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "**📝 評価の受け止め**" >> "${ROUND2_LOG}"
   echo "[実装プランに対するGeminiの評価への感情的反応]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "**🎯 新たな課題への気づき**" >> "${ROUND2_LOG}"
   echo "[Geminiが指摘した課題やリスクへの反応と驚き度]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "**🤔 提案内容への感想**" >> "${ROUND2_LOG}"
   echo "[具体的な改善提案や代替案への感想：有用性、実現可能性等]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "**⚡ 議論の進展への評価**" >> "${ROUND2_LOG}"
   echo "[ラウンド2での議論深化度や相互作用の質への感想]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## Claudeの戦略調整" >> "${ROUND2_LOG}"
   echo "[Geminiの評価を踏まえた実装戦略の調整]" >> "${ROUND2_LOG}"
   echo "[リスク軽減策の追加・実装順序の最適化]" >> "${ROUND2_LOG}"
   echo "" >> "${ROUND2_LOG}"
   echo "## 議論品質メトリクス（ラウンド2）" >> "${ROUND2_LOG}"
   echo "- 論点網羅性: ⭐⭐⭐⭐⭐ (詳細論点まで展開)" >> "${ROUND2_LOG}"
   echo "- 分析深度: ⭐⭐⭐⭐⚪ (深い分析まで到達)" >> "${ROUND2_LOG}"
   echo "- 合意形成: ⭐⭐⭐⚪⚪ (主要方針で合意形成)" >> "${ROUND2_LOG}"
   echo "- 実行可能性: ⭐⭐⭐⚪⚪ (具体的計画の策定)" >> "${ROUND2_LOG}"
   echo "- リスク分析: ⭐⭐⭐⭐⚪ (包括的リスク分析)" >> "${ROUND2_LOG}"
   ```

   ### ラウンド3: 最終提案と実装プラン（統合分析 + アクションアイテム）
   ```bash
   # ラウンド3のログファイルを作成
   ROUND3_LOG="./docs/discussion_logs/gemini_discussion_round3_${TIMESTAMP}.md"
   
   # 2ラウンドの統合分析
   echo "# Gemini議論ログ - ラウンド3 (${TIMESTAMP})" > "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## 前回までの議論統合" >> "${ROUND3_LOG}"
   echo "[ラウンド1-2の要点と調整内容]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## Claudeの最終実装プラン" >> "${ROUND3_LOG}"
   echo "[具体的なアクションアイテムと実装手順]" >> "${ROUND3_LOG}"
   echo "[優先順位付けと成功基準]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   
   # 最終評価の依頼
   GEMINI_RESPONSE=$(gemini <<EOF
   # これまでの議論内容
   $(cat "${ROUND1_LOG}" "${ROUND2_LOG}")
   
   # Claudeの最終実装プラン
   [統合された最終提案]
   
   上記の最終実装プランについて、総合的な評価をお願いします：
   1. プラン全体の妥当性と実現可能性
   2. 段階的実装アプローチの適切性
   3. 見落としがちなリスクや課題
   4. より効果的な実装順序の提案
   EOF
   )
   
   # 最終統合
   echo "## Geminiからの最終評価" >> "${ROUND3_LOG}"
   echo "${GEMINI_RESPONSE}" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## Claudeの率直な感想" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "Geminiの最終評価を受けての率直な感想：" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "**📝 最終評価への感想**" >> "${ROUND3_LOG}"
   echo "[3ラウンドを通じた総合評価への感情的反応：達成感、安心感、意外性等]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "**🎯 実行判断への反応**" >> "${ROUND3_LOG}"
   echo "[「実行を推奨」等の判断に対する反応：自信、確信、安心感等]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "**🤔 最終提案への感想**" >> "${ROUND3_LOG}"
   echo "[Geminiの最終提案や追加施策への感想：有用性、実現可能性、優先度等]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "**⚡ 3ラウンド議論全体への評価**" >> "${ROUND3_LOG}"
   echo "[議論プロセス全体の価値、Geminiとの協働効果、今後への活用可能性等]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## Claudeの最終結論" >> "${ROUND3_LOG}"
   echo "[Geminiの評価を反映した最終実装プラン]" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## 議論品質メトリクス（最終）" >> "${ROUND3_LOG}"
   echo "- 論点網羅性: ⭐⭐⭐⭐⭐ (全論点を網羅的に検討)" >> "${ROUND3_LOG}"
   echo "- 分析深度: ⭐⭐⭐⭐⭐ (詳細な分析完了)" >> "${ROUND3_LOG}"
   echo "- 合意形成: ⭐⭐⭐⭐⚪ (主要事項で高い合意)" >> "${ROUND3_LOG}"
   echo "- 実行可能性: ⭐⭐⭐⭐⭐ (具体的実行計画完成)" >> "${ROUND3_LOG}"
   echo "- リスク分析: ⭐⭐⭐⭐⭐ (包括的リスク対策)" >> "${ROUND3_LOG}"
   echo "" >> "${ROUND3_LOG}"
   echo "## 議論効果性評価" >> "${ROUND3_LOG}"
   echo "- 新たな洞察獲得: [Geminiとの議論で得られた新しい視点]" >> "${ROUND3_LOG}"
   echo "- 盲点の発見: [単独分析では見落としていた課題]" >> "${ROUND3_LOG}"
   echo "- 計画の精度向上: [議論を通じた実装計画の改善度]" >> "${ROUND3_LOG}"
   ```

4. **最終結論の生成（GitHub Issue準備版）**
   3ラウンドの議論完了後、GitHub Issue登録に最適化されたタスクベースの結論を生成：
   ```bash
   # GitHub Issue準備版結論ファイルの作成
   CONCLUSION_FILE="./docs/discussion_logs/gemini_conclusion_${TIMESTAMP}.md"
   
   # GitHub Issue登録用のタスクベース形式で作成
   echo "# Gemini議論 最終結論 (${TIMESTAMP})" > "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "## GitHub Issue タスク一覧" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 高優先度タスク" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   
   # 各タスクをGitHub Issue登録用形式で記述
   for i in {1..4}; do
     echo "#### Task ${i}: [タスク名]" >> "${CONCLUSION_FILE}"
     echo "**Labels**: \`enhancement\`, \`[priority-level]\`, \`[component]\`" >> "${CONCLUSION_FILE}"
     echo "**Priority**: High/Medium/Low" >> "${CONCLUSION_FILE}"
     echo "**AI実装難易度**: Easy/Medium/Hard (生成AIの得意/不得意を明記)" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
     echo "**説明**:" >> "${CONCLUSION_FILE}"
     echo "[タスクの目的と背景]" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
     echo "**実装内容**:" >> "${CONCLUSION_FILE}"
     echo "\`\`\`typescript" >> "${CONCLUSION_FILE}"
     echo "// [具体的なコード例やインターフェース定義]" >> "${CONCLUSION_FILE}"
     echo "\`\`\`" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
     echo "**受け入れ条件**:" >> "${CONCLUSION_FILE}"
     echo "- [ ] [測定可能な完了条件1]" >> "${CONCLUSION_FILE}"
     echo "- [ ] [測定可能な完了条件2]" >> "${CONCLUSION_FILE}"
     echo "- [ ] [測定可能な完了条件3]" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
     echo "**依存関係**: [他タスクとの依存関係]" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
     echo "---" >> "${CONCLUSION_FILE}"
     echo "" >> "${CONCLUSION_FILE}"
   done
   
   echo "### 中優先度タスク" >> "${CONCLUSION_FILE}"
   echo "[中優先度タスクを同様形式で記述]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 低優先度タスク" >> "${CONCLUSION_FILE}"
   echo "[低優先度タスクを同様形式で記述]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 将来検討項目" >> "${CONCLUSION_FILE}"
   echo "[長期的検討事項をエピック形式で記述]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   
   # 技術実装ガイダンス
   echo "## 技術実装ガイダンス" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 生成AI実装に適したタスク (Easy/Medium)" >> "${CONCLUSION_FILE}"
   echo "- [生成AIが得意な具体的タスク類型]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 生成AIが困難なタスク (Hard)" >> "${CONCLUSION_FILE}"
   echo "- [人間の判断・調整が必要なタスク類型]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 技術選択理由" >> "${CONCLUSION_FILE}"
   echo "- ✅ [採用技術とその理由]" >> "${CONCLUSION_FILE}"
   echo "- ❌ [不採用技術とその理由]" >> "${CONCLUSION_FILE}"
   echo "" >> "${CONCLUSION_FILE}"
   echo "### 実装時の注意点" >> "${CONCLUSION_FILE}"
   echo "1. [重要な制約・原則]" >> "${CONCLUSION_FILE}"
   echo "2. [品質保証要件]" >> "${CONCLUSION_FILE}"
   echo "3. [パフォーマンス要件]" >> "${CONCLUSION_FILE}"
   echo "4. [保守性要件]" >> "${CONCLUSION_FILE}"
   ```

## 議論プロセスの詳細

### 各ラウンドの記録内容
各ラウンドのログファイルには以下の情報を記録します：

1. **Claudeの分析・質問セクション**
   - 現在の課題認識
   - 前回までの議論を踏まえた考察
   - Geminiへの具体的な質問事項

2. **Geminiへのプロンプトセクション**
   - 送信する完全なプロンプト内容
   - 前回までの議論内容（ラウンド2以降）

3. **Geminiの回答セクション**
   - Geminiからの完全な回答

4. **Claudeの考察セクション**
   - Geminiの回答に対する分析
   - 次のラウンドへの方向性
   - 新たな疑問点や深掘りポイント

### 累積的な議論の流れ
- **ラウンド1**: Claude主導分析 + 実装制約設定 + Gemini客観評価
- **ラウンド2**: ラウンド1統合 + Claude実装戦略 + Geminiリスク評価
- **ラウンド3**: ラウンド1-2統合 + Claude最終プラン + Gemini総合評価

## 使用例

### 特定トピックの議論
```
/discuss-with-gemini GraphQL スキーマ最適化
```
特定の領域に議論を焦点化します

### ファイル固有の分析
```
/discuss-with-gemini @src/game/board.ts の実装をレビューして
```
Geminiの洞察により特定のファイルを分析します

## 追加指示
$ARGUMENTS

## 期待される成果
- **議論ログ（各ラウンドごと）**：
  - ClaudeとGeminiの完全な対話履歴
  - **Claudeの率直な感想**：Geminiの回答に対する感情的反応、専門性評価、新たな気づき等
  - 思考過程と試行錯誤の記録
  - 累積的な知見の蓄積
  
- **最終結論ファイル（GitHub Issue準備版）**：
  - 3ラウンドの議論を統合したタスクリスト
  - GitHub Issue登録用の構造化された情報
  - 生成AI実装難易度を含む技術ガイダンス
  - 優先度別・依存関係明確なタスク分解

## 注意事項
- 議論は理解とコミュニケーションの向上のために完全に日本語で実行されます
- Geminiは前回の記憶を保持しないため、各ラウンドで前回までの議論内容を明示的にインプットとして提供します
- 各ラウンドのログファイルは個別に保存され、完全な対話プロセスが追跡可能です
- 最終結論ファイルには結論のみを記載し、議論の過程は各ラウンドのログで確認できます
- ファイル保存場所：
  - 議論ログ: `./docs/discussion_logs/gemini_discussion_round[1-3]_${TIMESTAMP}.md`
  - 最終結論: `./docs/discussion_logs/gemini_conclusion_${TIMESTAMP}.md`
