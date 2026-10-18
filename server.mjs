// 零依赖 Pay Gateway 示例（Node 原生 http）— 演示 SkillHub 付费链路
// 职责：未付款返回 402 + Payment-Needed 账单；付款后返回资源并发履约回执。
// ⚠️ 演示版只做本地 402 链路联调，不调用支付宝验单。生产部署必须把
//    “凭证校验”替换为调用支付宝 AI 付查询订单 + 验签，并把 200 分支接你的生成模型。
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = process.env.PORT || 3000;
// 上线前替换：支付宝「服务注册」获得的真实 serviceId（形如 API_xxxx）
const SERVICE_ID = process.env.SERVICE_ID || "api_mock_service_id";
// PPT 付费 Skill 专用 serviceId（支付宝侧另注册一个服务，地址填 https://你的域名/api/ppt）
const PPT_SERVICE_ID = process.env.PPT_SERVICE_ID || SERVICE_ID;
// 上线前替换：卖家支付宝用户 ID（2088 开头）
const SELLER_ID = process.env.SELLER_ID || "2088000000000000";
// 单次价格（元），须与支付宝登记、SkillHub 展示一致（0.01~50，最多两位小数）
const PRICES = {
  "/api/internal-comms": "0.50",
  "/api/file-organizer": "0.50",
  "/api/meeting-notes": "0.50",
  "/api/ppt": "0.50",
};

// 每个业务路径对应的 serviceId（PPT 用专用服务）
function serviceIdFor(path) {
  return path === "/api/ppt" ? PPT_SERVICE_ID : SERVICE_ID;
}

function makeBill(resourceUrl, amount, sid) {
  // 单行 JSON，无换行；真实账单应由支付宝 AI 付体系生成（含订单号、签名、过期时间）
  return JSON.stringify({
    serviceId: sid,
    sellerId: SELLER_ID,
    amount,
    currency: "CNY",
    resourceUrl,
    sessionId: randomUUID(),
    note: "skillhub-pay-demo",
  });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const path = req.url.split("?")[0];
    const amount = PRICES[path];
    if (!amount) { res.writeHead(404); return res.end("not found"); }
    const proto = req.headers["x-forwarded-proto"] || "https";
    const resourceUrl = `${proto}://${req.headers.host}${req.url}`;

    // —— 验付 ——
    // 演示：仅检查 x-payment-proof 头非空。
    // 生产：必须替换为调用支付宝查询原订单并校验签名/凭证，无效或过期不交付。
    const proof = req.headers["x-payment-proof"];
    if (!proof) {
      res.writeHead(402, { "Payment-Needed": makeBill(resourceUrl, amount, serviceIdFor(path)) });
      return res.end("402 Payment Required");
    }

    // —— 交付 + 履约 ——
    // 真实部署：在此调用你的生成模型/服务，按 req 参数产出结果。
    const result = {
      ok: true,
      paid: true,
      skill: path,
      echo: safeParse(body),
      generated:
        "[付费生成结果占位] 真实部署时在此调用你的模型，生成内部沟通文档 / 目录整理方案 / 会议纪要。",
      fulfilledAt: new Date().toISOString(),
    };
    // 商家履约确认：真实环境向支付宝发送履约回执（失败可重试，保持幂等）。
    console.log(`[fulfill] ${path} amount=${amount} proof=${String(proof).slice(0, 12)}...`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result, null, 2));
  });
});

server.listen(PORT, () => {
  console.log(`Pay gateway listening on :${PORT} (SERVICE_ID=${SERVICE_ID})`);
});
