# tamable 用 GitHub リポジトリの作成手順

## 1. GitHub で新しいリポジトリを作る

1. ブラウザで **https://github.com/new** を開く（ログインしていない場合は GitHub にログイン）
2. 次のように入力：
   - **Repository name**: `tamable`（または任意の名前）
   - **Description**: （任意）例: 天気時系列チャート SPA
   - **Public** を選択
   - **「Add a README file」はチェックしない**（このプロジェクトには既に README があるため）
   - **Create repository** をクリック

3. 作成後、表示される **リポジトリの URL** をコピーする  
   例: `https://github.com/あなたのユーザー名/tamable.git`

---

## 2. いまのリモートを外して、新しいリポジトリを登録する

ターミナルで **プロジェクトのフォルダ**（tamable）に移動してから実行：

```bash
cd /Users/Friday/Desktop/dev/tamable

# 今の origin（test-ec-site）を外す
git remote remove origin

# 新しいリポジトリを origin として登録（URL は 1. でコピーしたものに置き換え）
git remote add origin https://github.com/あなたのユーザー名/tamable.git
```

---

## 3. ファイルをコミットしてプッシュする

まだコミットしていない変更がある場合：

```bash
git add .
git status
git commit -m "feat: 天気時系列チャート SPA（都市・指標・期間選択、Open-Meteo、複数指標・単位トグル）"
git branch -M main
git push -u origin main
```

すでにコミット済みで、あとはプッシュするだけの場合：

```bash
git push -u origin main
```

---

## 4. README のリポジトリ URL を書く

GitHub のリポジトリページで **Code** の緑ボタンから表示される URL をコピーし、  
このプロジェクトの **README.md** の「【提出】対応一覧」にある「リポジトリURL」の行に貼り付けて保存する。

例: `https://github.com/あなたのユーザー名/tamable`
