# dev 构思范例（BE）

> **全端统一叙述五段式**：摘要 + 主流程 + 边界 + 实现说明 + 结果。  
> **唯一质量线 = 完整**：逻辑块「怎么做」须编号 ≥2 且含「条件 → 动作」；边界 ≥2 且挂第 N 步。  
> BE 主流程写 **请求/事件 → Controller → Service**；细节在实现说明展开。  
> 颗粒度 → [dev-granularity.md](../templates/dev-granularity.md) · FE 范例 → [dev-exemplar-FE](dev-exemplar-FE.md)

# [T-003-BE] 订单支付 — 构思 [BE]
- → [F-003](../solution/features/F-003-订单支付.md) · [API-003](../solution/contracts/API-003-订单支付.md) · 写法：code-patterns-backend

## 摘要

- **本 T**：F-003 后端切片；用户对待支付订单发起支付，走第三方渠道扣款并回调更新订单与库存。
- **做**：新写 PaymentController/Service + Inventory 预占 + ChannelAdapter；改动 order 超时取消钩子
- **不做**：退款（F-004）、前端支付页（T-003-FE）、渠道 SDK 选型
- **上游**：F-003 · API-003 · depends_on T-001（订单）、T-002（JwtFilter 401）
- **AC**：AC-003-01～05

## 主流程

> 入口：POST /api/payments（API-003 createPayment）

1. 请求进入 → `PaymentController.createPayment()` → 参数与时间戳校验
2. 校验通过 → `PaymentService.validateOrder()` → 拿到有效 OrderDO
3. 订单有效 → `checkIdempotency()` → Redis 幂等锁建立
4. 加锁成功 → `InventoryService.preDeductBatch()` → 库存预占确认
5. 预占成功 → `createPaymentRecord()` → PaymentDO 落库 PENDING
6. 记录就绪 → `ChannelAdapter.prePay()` → 200 + 跳转参数（AC-003-01）

## 边界

- **参数非法**：第 1 步 → 1001/1003
- **订单不存在/已付/超时**：第 2 步 → 2001/2002/2004；超时异步 `orderService.cancel`
- **重复支付**：第 3 步锁已存在 → 3001（AC-003-02）
- **库存不足**：第 4 步 → 4002，释放 S3 锁（AC-003-03）
- **DB/渠道失败**：第 5～6 步 → 回滚已预扣库存 + 释放幂等锁
- **回调验签失败**：另 T 处理；本 T 只保证预下单出口

## 实现说明

### `PaymentController.java` 【新写】

- **目的**：支付 HTTP 入口，承接 API-003
- **做什么**：`createPayment(PaymentRequest req)`
- **怎么做**：
  1. 校验 orderId/payChannel/timestamp → 非法则 1001/1003
  2. 调 `paymentService.createPayment(req)` → 编排后续步骤
  3. 统一封装 Result → 401 走全局 JwtFilter

### `PaymentService.java` 【新写】

- **目的**：支付编排与事务边界
- **做什么**：`validateOrder` / `checkIdempotency` / `createPaymentRecord`
- **怎么做 — validateOrder**：
  1. `orderService.getById` → null → 2001
  2. status ≠ PENDING_PAY → 2002/2003
  3. 超时 → 2004 + 异步 cancel
- **怎么做 — checkIdempotency**：
  1. `redisTemplate.setIfAbsent(pay:idempotency:…)`
  2. false 且 PROCESSING → 3001
  3. Redis 失败 → 降级查 `paymentIdempotencyMapper`
- **怎么做 — createPaymentRecord**：
  1. 组装 PaymentDO 状态 PENDING → insert
  2. 失败 → 回滚库存 + 释放锁

### `InventoryService.java` 【改动】

- **目的**：批量预占库存
- **做什么**：`preDeductBatch(skuList, orderId)`
- **怎么做**：
  1. 逐 SKU 加锁 → 查可用量 → `preDeduct`
  2. 任一失败 → 回滚已预扣并抛 4002

### `ChannelAdapter.java` 【新写】

- **目的**：调第三方预下单
- **做什么**：`prePay(PaymentDO)`
- **怎么做**：
  1. 按 payChannel 路由 Alipay/WeChat
  2. 失败抛业务异常 → 触发库存+幂等锁回滚

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | `mvn -q test` exit 0 ✅ · curl POST /api/payments → 200 ✅ |
| AC 映射 | AC-003-01～05 见 `test/unit/payment/` ✅ |
