# 開発環境構築ツール設計書

## 概要

個人用の開発環境構築ツール。GUIでOS・言語・ツールを選択するだけで、Dockerfileを自動生成しコンテナを構築できるサービス。

## 開発プロセス

### チケット駆動開発

このプロジェクトはチケット駆動開発（Ticket-Driven Development）で進めます：

1. **必ずIssueを立てる**: 実装前に必ずGitHub Issueを作成してタスクを明確化
2. **Issue → 実装 → レビュー**: 各機能をIssue単位で実装し、レビューを通して品質を担保
3. **TodoWrite活用**: 複雑なタスクはTodoWriteツールでサブタスクに分解して管理
4. **段階的実装**: Phase 1（MVP）から順次機能を追加
5. コミットは細かくする。
6. コミット、ブランチにはかならずprefixをつける。

### 開発フロー

```
Issue作成 → ブランチ作成 → 実装 → テスト → PR → レビュー → マージ
```

## アーキテクチャ

### 技術スタック

```
Frontend: React + Tailwind CSS
Backend: Rust (Axum/Actix-web) + Bollard (Docker SDK for Rust)
Database: SQLite (設定・テンプレート保存用) with SQLx
Container: Docker API経由で管理
```

## UI設計

### ステップ形式の構築フロー

#### Step 1: ベースOS選択

- Ubuntu (20.04 / 22.04 / 24.04)
- Debian (bullseye / bookworm)
- Alpine (軽量版)
- Rocky Linux

#### Step 2: 言語/ランタイム選択（複数選択可）

- Python (3.9 / 3.10 / 3.11 / 3.12)
- Node.js (18 LTS / 20 LTS / 22 LTS)
- Rust (stable / nightly)
- C/C++ (gcc / clang)
- Go (1.21 / 1.22 / 1.23)

#### Step 3: 追加ツール選択（オプション）

- Git
- Docker CLI
- PostgreSQL Client
- CUDA Toolkit (11.8 / 12.0 / 12.4)
- カスタムパッケージ入力欄

#### Step 4: 環境変数・ポート設定

- 環境変数のキー・バリュー入力
- 公開ポートの設定

#### Step 5: ボリュームマウント設定

- ホスト側パス
- コンテナ側パス
- 読み取り専用オプション

## 主要機能

### 1. Dockerfile自動生成

選択内容から最適なDockerfileを生成

```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Config {
    os: String,
    version: String,
    languages: Vec<Language>,
    // ... 他のフィールド
}

#[derive(Deserialize)]
struct Language {
    name: String,
    version: String,
}

fn generate_dockerfile(config: &Config) -> String {
    let mut dockerfile = format!("FROM {}:{}\n\n", config.os, config.version);
    
    // パッケージマネージャの更新
    dockerfile.push_str("RUN apt-get update && apt-get install -y \\\n");
    
    // 言語インストールコマンドを組み立て
    for lang in &config.languages {
        match lang.name.as_str() {
            "python" => {
                dockerfile.push_str(&format!("    python{} \\\n", lang.version));
                dockerfile.push_str("    python3-pip \\\n");
            }
            "rust" => {
                dockerfile.push_str("    curl \\\n");
                dockerfile.push_str("    build-essential \\\n");
            }
            "nodejs" => {
                dockerfile.push_str(&format!("    nodejs={} \\\n", lang.version));
                dockerfile.push_str("    npm \\\n");
            }
            _ => {}
        }
    }
    
    dockerfile.push_str("    && rm -rf /var/lib/apt/lists/*\n");
    
    // Rustのインストール（別途）
    if config.languages.iter().any(|l| l.name == "rust") {
        dockerfile.push_str("\nRUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y\n");
        dockerfile.push_str("ENV PATH=\"/root/.cargo/bin:${PATH}\"\n");
    }
    
    dockerfile
}
```

### 2. プレビュー機能

生成されるDockerfileを事前確認・手動編集可能

### 3. テンプレート管理

- よく使う環境設定を保存
- テンプレートからの読み込み
- テンプレートの共有（JSON/YAML形式でエクスポート）

### 4. コンテナ管理

- ワンクリックでビルド & 実行
- コンテナの起動/停止/削除
- ログのリアルタイム表示
- コンテナへのシェルアクセス

### 5. イメージ管理

- ビルド済みイメージ一覧
- イメージの削除
- タグ管理

## 開発ロードマップ

### Phase 1: MVP（最小構成）

- OS選択（Ubuntu/Debian/Alpine）
- 言語選択（Python/Node.js/Rust）
- 基本的なDockerfile生成
- シンプルなビルド & 実行機能

### Phase 2: 機能拡充

- 追加ツール選択機能
- 環境変数・ポート設定
- ボリュームマウント設定
- プレビュー機能

### Phase 3: 利便性向上

- テンプレート保存・読み込み
- ログ表示機能
- コンテナ管理UI
- 設定のエクスポート/インポート

### Phase 4: 高度な機能

- Docker Compose対応
- マルチステージビルド対応
- リソース制限設定
- ネットワーク設定

## データモデル

### Environment Configuration

```json
{
  "name": "Python ML環境",
  "os": {
    "type": "ubuntu",
    "version": "22.04"
  },
  "languages": [
    {
      "name": "python",
      "version": "3.11"
    }
  ],
  "tools": [
    "git",
    "postgresql-client"
  ],
  "custom_packages": [
    "libgdal-dev",
    "cuda-toolkit-12-0"
  ],
  "env_vars": {
    "PYTHONUNBUFFERED": "1"
  },
  "ports": [
    "8000:8000"
  ],
  "volumes": [
    {
      "host": "./data",
      "container": "/app/data",
      "readonly": false
    }
  ]
}
```

## API設計

### Dockerfile生成

```
POST /api/dockerfile/generate
Request: Environment Configuration JSON
Response: Generated Dockerfile text
```

### コンテナビルド

```
POST /api/container/build
Request: Dockerfile + build options
Response: Build logs stream
```

### コンテナ起動

```
POST /api/container/run
Request: Image name + run options
Response: Container ID
```

### コンテナ一覧取得

```
GET /api/containers
Response: List of running/stopped containers
```

### テンプレート保存

```
POST /api/templates
Request: Environment Configuration + template name
Response: Template ID
```

## 実装上の考慮事項

### 主要な依存クレート

```toml
[dependencies]
# Web Framework
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "fs"] }

# Docker API
bollard = "0.16"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"
```

### Axumルーター例

```rust
use axum::{
    routing::{get, post},
    Router,
    Json,
    extract::State,
};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let app_state = Arc::new(AppState::new().await);
    
    let app = Router::new()
        .route("/api/dockerfile/generate", post(generate_dockerfile_handler))
        .route("/api/container/build", post(build_container_handler))
        .route("/api/container/run", post(run_container_handler))
        .route("/api/containers", get(list_containers_handler))
        .route("/api/templates", post(save_template_handler))
        .route("/api/templates", get(list_templates_handler))
        .with_state(app_state);
    
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    
    axum::serve(listener, app).await.unwrap();
}
```

### Docker操作の実装例

```rust
use bollard::Docker;
use bollard::image::BuildImageOptions;
use bollard::container::{Config as ContainerConfig, CreateContainerOptions};
use futures_util::stream::StreamExt;

async fn build_image(
    docker: &Docker,
    dockerfile: &str,
    tag: &str,
) -> Result<(), anyhow::Error> {
    let mut build_options = BuildImageOptions::default();
    build_options.t = tag.to_string();
    
    let mut image_build_stream = docker.build_image(
        build_options,
        None,
        Some(dockerfile.into()),
    );
    
    while let Some(build_info) = image_build_stream.next().await {
        match build_info {
            Ok(info) => {
                // ビルドログをWebSocketで送信
                tracing::info!("{:?}", info);
            }
            Err(e) => return Err(e.into()),
        }
    }
    
    Ok(())
}

async fn run_container(
    docker: &Docker,
    image: &str,
    config: ContainerRunConfig,
) -> Result<String, anyhow::Error> {
    let container_config = ContainerConfig {
        image: Some(image.to_string()),
        env: Some(config.env_vars),
        exposed_ports: config.ports,
        host_config: Some(bollard::service::HostConfig {
            binds: Some(config.volumes),
            ..Default::default()
        }),
        ..Default::default()
    };
    
    let container = docker
        .create_container::<&str, &str>(None, container_config)
        .await?;
    
    docker.start_container::<String>(&container.id, None).await?;
    
    Ok(container.id)
}
```

### セキュリティ

- Docker APIへのアクセス制限
- ローカルホストのみからのアクセス
- ファイルパスのバリデーション

### パフォーマンス

- ビルドキャッシュの活用
- イメージレイヤーの最適化
- 非同期ビルド処理

### ユーザビリティ

- ビルド進捗の可視化
- エラーメッセージの分かりやすさ
- キーボードショートカット対応

## 想定ユースケース

1. **新規プロジェクト開始時**: 必要な言語とツールを選択して即座に開発環境を構築
2. **環境の複製**: 本番環境に近い設定を再現
3. **複数バージョンのテスト**: 異なるPythonバージョンでのテスト環境を並行構築
4. **CUDA環境の構築**: GPU開発環境の簡単セットアップ
5. **クリーンな環境での検証**: 依存関係の問題を切り分け

## 拡張可能性

- GitHub Actionsとの連携
- CI/CD環境としての利用
- チーム内での環境設定共有
- クラウド環境へのデプロイ対応

## Rustバックエンドの利点

### パフォーマンス
- 高速なビルド処理とコンテナ操作
- 低メモリフットプリント
- 並行処理の安全性（Tokioによる非同期処理）

### 型安全性
- コンパイル時のエラー検出
- 設定のバリデーションが厳密
- Docker APIの型安全なラッパー（Bollard）

### 信頼性
- メモリ安全性の保証
- パニック時の適切なエラーハンドリング
- 長時間稼働でも安定

### プロジェクト構成例

```
project/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── dockerfile.rs
│   │   ├── container.rs
│   │   └── template.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── config.rs
│   │   └── template.rs
│   ├── services/
│   │   ├── mod.rs
│   │   ├── docker.rs
│   │   └── dockerfile_generator.rs
│   └── db/
│       ├── mod.rs
│       └── migrations/
├── frontend/
│   ├── package.json
│   ├── src/
│   └── public/
└── README.md
```
