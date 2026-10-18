// pay-gateway — Cloudflare Workers 版（免信用卡，零依赖）
// 与 server.mjs 逻辑一致：未付款返回 402 + Payment-Needed 账单；付款后交付并发履约回执。
// ⚠️ 演示版只联调 402，不调用支付宝验单。生产必须把"凭证校验"改为支付宝查单+验签，
//    并把 200 分支接你的生成模型。serviceId / SELLER_ID 只放 Workers 环境变量（ Secrets/Vars ）。
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const PRICES = {
      "/api/internal-comms": "0.50",
      "/api/file-organizer": "0.50",
      "/api/meeting-notes": "0.50",
      "/api/ppt": "0.50",
    };
    const amount = PRICES[path];
    if (!amount) return new Response("not found", { status: 404 });

    const SERVICE_ID = env.SERVICE_ID || "api_mock_service_id";
    const PPT_SERVICE_ID = env.PPT_SERVICE_ID || SERVICE_ID;
    const SELLER_ID = env.SELLER_ID || "2088000000000000";

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const resourceUrl = `${proto}://${url.host}${url.pathname}${url.search}`;
    const sid = path === "/api/ppt" ? PPT_SERVICE_ID : SERVICE_ID;

    // —— 验付 ——（演示：仅检查 x-payment-proof 非空）
    const proof = request.headers.get("x-payment-proof");
    if (!proof) {
      // 账单为单行 JSON（HTTP 头不能含换行）；真实账单应由支付宝 AI 付体系生成
      const bill = JSON.stringify({
        serviceId: sid,
        sellerId: SELLER_ID,
        amount,
        currency: "CNY",
        resourceUrl,
        sessionId: crypto.randomUUID(),
        note: "skillhub-pay-demo",
      });
      return new Response("402 Payment Required", {
        status: 402,
        headers: { "Payment-Needed": bill, "Content-Type": "text/plain" },
      });
    }

    // —— 交付 + 履约 ——（真实部署：在此调用你的生成模型/服务）
    const body = await request.text();
    let echo;
    try { echo = JSON.parse(body); } catch { echo = body; }
    const result = {
      ok: true,
      paid: true,
      skill: path,
      echo,
      generated:
        "[付费生成结果占位] 真实部署时在此调用你的模型，生成内部沟通文档 / 目录整理方案 / 会议纪要 / 高级感 PPT。",
      fulfilledAt: new Date().toISOString(),
    };
    console.log(`[fulfill] ${path} amount=${amount} proof=${String(proof).slice(0, 12)}...`);
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
