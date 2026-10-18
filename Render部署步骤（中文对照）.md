# Render 部署 pay-gateway 中文对照步骤

## 当前页面：Render 首页
点这个卡片里的链接：

> **Web Services** → **New Web Service →**

（Static Sites / Private Services / Background Workers 都不要点）

---

## 第 1 步：选择源码

### 情况 A：看到 GitHub 仓库列表
找到 `KONERYAN/pay-gateway`，点它，再点 **Connect** / **Continue**。

### 情况 B：没看到仓库 / 只有 GitLab Bitbucket
1. 点 **Public Git Repository**（公开 Git 仓库）标签页。
2. 输入框粘贴：
   ```
   https://github.com/KONERYAN/pay-gateway
   ```
3. 点 **Continue**。

> 如果这步报错 404，说明 GitHub 还没有这个仓库，先按文末「先创建仓库」操作。

---

## 第 2 步：Configure and deploy

| 英文 | 中文 | 填写 |
|---|---|---|
| Name | 服务名 | `pay-gateway` |
| Region | 地区 | **Singapore**（推荐，离中国近） |
| Branch | 分支 | `main` |
| Build Command | 构建命令 | `npm install` |
| Start Command | 启动命令 | `node server.mjs` |
| Instance Type | 实例类型 | **Free** |

---

## 第 3 步：Environment Variables（环境变量）

点 **Add Environment Variable**，加两行：

| Key | Value |
|---|---|
| `SERVICE_ID` | `api_mock_service_id` |
| `SELLER_ID` | `2088000000000000` |

这两个先用占位值，跑通 402 后再换成支付宝真实值。

---

## 第 4 步：Deploy

点最下方 **Deploy Web Service**。

等待 1–2 分钟，出现绿色链接：

```
https://pay-gateway-xxxxxxxx.onrender.com
```

把这个完整链接发给 KONERYAN 的 AI 助手，回填到 Skill 里。

---

## 验证 402 链路

拿到域名后，在任意终端执行：

```bash
curl -i -X POST https://pay-gateway-xxxxxxxx.onrender.com/api/internal-comms \
  -H "Content-Type: application/json" -d '{"brief":"test"}'
```

期望返回 `HTTP 402` + `Payment-Needed` 响应头。

---

## 附录：先创建 GitHub 仓库（如果还没有）

1. 浏览器访问 `https://github.com/new`
2. Repository name 填 `pay-gateway`
3. 选 **Public**（公开）
4. 点 **Create repository**
5. 在沙箱/电脑终端执行：

```bash
cd /workspace/pay-gateway
git init && git add . && git commit -m "init"
git remote add origin https://github.com/KONERYAN/pay-gateway.git
git branch -M main
git push -u origin main
```

如果提示输入密码，填 **GitHub Token**（不是登录密码）。
生成 Token：
`github.com/settings/tokens` → **Generate new token (classic)** → 勾选 **repo** → 复制使用。
