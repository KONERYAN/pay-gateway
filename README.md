# pay-gateway — SkillHub Pay Skill 后端示例

零依赖（Node 原生 `http`）的演示网关，用于跑通 SkillHub 按量付费链路：
未付款时返回 `402 + Payment-Needed` 账单；付款后返回资源并发履约回执。

> ⚠️ 演示版只做本地 402 链路联调，**不调用支付宝验单**。生产部署必须把
> “凭证校验”替换为调用支付宝 AI 付查询订单 + 验签，并把 200 分支接你的生成模型。

## 运行
```bash
cd /workspace/pay-gateway
export PORT=3000
export SERVICE_ID=api_mock_service_id   # 上线替换为支付宝注册的真实 serviceId
export PPT_SERVICE_ID=api_mock_service_id  # PPT 付费 Skill 专用服务（/api/ppt）
export SELLER_ID=2088000000000000       # 卖家支付宝用户 ID
node server.mjs
```

## 四个业务路径（对应 4 个 Pay Skill）
| 路径 | 对应 Skill | 单价 |
|---|---|---|
| `/api/internal-comms` | koneryan-internal-comms-pro | ¥0.50 |
| `/api/file-organizer` | koneryan-file-organizer-pro | ¥0.50 |
| `/api/meeting-notes` | koneryan-meeting-notes-pro | ¥0.50 |
| `/api/ppt` | koneryan-ppt-premium | ¥0.50 |

## 验证 402
```bash
curl -i -X POST https://你的域名/api/internal-comms \
  -H "Content-Type: application/json" -d '{"brief":"test"}'
# 期望：HTTP 402 + Payment-Needed: <账单JSON>
```

## 生产改造清单
1. `SERVICE_ID` / `SELLER_ID` 替换为真实值。
2. 402 分支的 `x-payment-proof` 校验改为：调用支付宝查询原订单 + 校验签名/凭证，无效或过期不交付。
3. 200 分支把占位文本替换为调用你的模型/服务生成结果。
4. 部署到公网 HTTPS（如腾讯云 Lighthouse；未成年可用 Render/Railway 等海外免实名 PaaS），把地址填进 4 个 Pay Skill 的 `GATEWAY_BASE`。
5. 私钥/公钥仅存服务端环境变量，不入库、不进 Skill 包。

## 依赖
`node_modules/@alipay/alipay-aipay` 与 `@alipay/agent-payment` 已安装（教程卖家/买家能力），
本网关演示无需它们；它们供 Pay Skill 的 `paid.mjs` 在支付阶段调用 `alipay-bot` 使用。
