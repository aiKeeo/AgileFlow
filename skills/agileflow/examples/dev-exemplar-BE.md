# dev 构思范例（BE）

> ① 照此结构写；接口链 API；**禁止**在 dev 内写字段映射表。
> 标准/完整优先 **原子步骤表**（每 `####` 一个步骤 + 8 字段规格表）；精简可用 `####` + **涉及改动**/**改**。更多 → [dev-reuse-examples](dev-reuse-examples.md)
>
> **8 字段必须全列**（值可填"无"，但行不能省）：
> 执行角色 / 触发条件 / 输入数据 / 处理逻辑（含所有 if/else）/ 调用依赖（`Service.method(params)`）/ 异常处理（错误码+回滚）/ 输出数据 / 状态变更

# [T-003-BE] 订单支付 — 构思 [BE]

- 档位：**完整** · depends_on：T-001(订单创建), T-002(用户鉴权)
- → [F-003](../solution/features/F-003-订单支付.md) · [API-003](../solution/contracts/API-003-订单支付.md) · 写法：code-patterns-backend

## 摘要

- **本 T**：F-003 的后端切片（T-003-BE）；用户对待支付订单发起支付，走第三方渠道完成扣款并回调更新订单与库存。
- **做**：支付请求校验、幂等锁、库存预占、创建支付记录、调渠道预下单、回调验签+状态更新+库存确认；401 走全局鉴权。
- **不做**：退款（F-004）、对账（F-005）、前端支付页（T-003-FE）、支付渠道 SDK 选型（架构层已定 Alipay/WeChat）。
- **上游**：[F-003](../solution/features/F-003-订单支付.md) · [API-003](../solution/contracts/API-003-订单支付.md) · depends_on [T-001](../dev/T-001-order-create-BE.md)（订单创建）、[T-002](../dev/T-002-auth-BE.md)（JwtFilter 401）。
- **AC**：AC-003-01（支付成功 200+跳转参数）、AC-003-02（重复支付拦截 3001）、AC-003-03（库存不足 4002）、AC-003-04（回调验签失败丢弃）、AC-003-05（超时取消 2004）。

## 步骤

#### S1：接收支付请求

| 字段 | 内容 |
|------|------|
| 执行角色 | 前端 → 后端 `PaymentController.createPayment` |
| 触发条件 | 用户在订单详情页点击【立即支付】按钮 |
| 输入数据 | `orderId`(Long, 必填), `payChannel`(String, 枚举: ALIPAY/WECHAT), `clientIp`(String, 从请求头 `X-Forwarded-For` 获取), `timestamp`(Long, 当前时间戳, 防重放) |
| 处理逻辑 | ① 校验 `orderId` 是否为正整数 → 否 → 抛 `INVALID_PARAM(1001)` ② 校验 `payChannel` 是否在枚举范围 → 否 → 抛 `UNSUPPORTED_CHANNEL(1002)` ③ 校验时间戳与服务器时间差 < 5 分钟 → 否 → 抛 `REQUEST_EXPIRED(1003)` |
| 调用依赖 | 无外部调用；`PaymentController.createPayment(PaymentRequest req)` 入口 |
| 异常处理 | 所有校验失败 → 返回 `Result.fail(errorCode, "参数错误")`；不记录业务日志 |
| 输出数据 | 校验通过的 `orderId`, `payChannel`, `clientIp` |
| 状态变更 | 无 |

#### S2：获取并校验订单

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentService.validateOrder` |
| 触发条件 | S1 校验通过 |
| 输入数据 | `orderId` |
| 处理逻辑 | ① 调用 `orderService.getById(orderId)` 查询订单 ② if 订单不存在 → 抛 `ORDER_NOT_FOUND(2001)` ③ if 订单状态 ≠ `PENDING_PAY` → if 状态 = `PAID` → 抛 `ORDER_ALREADY_PAID(2002)`；else → 抛 `ORDER_STATUS_INVALID(2003)` ④ if 订单创建时间 + 30 分钟 < 当前时间 → 抛 `ORDER_EXPIRED(2004)`，并异步调用 `orderService.cancel(orderId)` ⑤ if 订单金额 ≤ 0 → 抛 `INVALID_ORDER_AMOUNT(2005)` |
| 调用依赖 | `orderService.getById(Long orderId)` → 返回 `OrderDO`；`orderService.cancel(Long orderId)` → 异步, 无需等待 |
| 异常处理 | `ORDER_NOT_FOUND` → `Result.fail(2001, "订单不存在")`；`ORDER_ALREADY_PAID` → `Result.fail(2002, "订单已支付")`；`ORDER_STATUS_INVALID` → `Result.fail(2003, "订单状态异常")`；`ORDER_EXPIRED` → `Result.fail(2004, "订单已过期")` + 触发取消；`INVALID_ORDER_AMOUNT` → `Result.fail(2005, "订单金额异常")` |
| 输出数据 | `OrderDO`（含 `orderId`, `userId`, `totalAmount`, `status`, `createTime`, `skuList`） |
| 状态变更 | 若订单过期：订单状态 → `CANCELLED` |

#### S3：幂等性校验（防重复支付）

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentService.checkIdempotency` |
| 触发条件 | S2 校验通过 |
| 输入数据 | `orderId`, `userId` |
| 处理逻辑 | ① 生成幂等键 `idempotencyKey = "pay:idempotency:" + orderId + ":" + userId` ② 调用 `redisTemplate.opsForValue().setIfAbsent(idempotencyKey, "PROCESSING", 60, SECONDS)` 尝试加锁 ③ if 返回 `false`（键已存在）→ 获取键值 → if 值 = `"PROCESSING"` → 抛 `PAYMENT_IN_PROGRESS(3001)`；if 值 = `"SUCCESS"` → 抛 `ORDER_ALREADY_PAID(2002)` ④ if 返回 `true`（加锁成功）→ 继续 |
| 调用依赖 | `redisTemplate.opsForValue().setIfAbsent(String key, String value, long timeout, TimeUnit unit)` → `Boolean`；`redisTemplate.opsForValue().get(String key)` → `String` |
| 异常处理 | `PAYMENT_IN_PROGRESS` → `Result.fail(3001, "支付处理中，请稍后再试")`；`ORDER_ALREADY_PAID` → 同 S2；Redis 连接失败 → 抛 `REDIS_ERROR(9001)`，降级查 DB 幂等表 `paymentIdempotencyMapper.selectByOrderId(orderId)` |
| 输出数据 | 幂等锁已建立 |
| 状态变更 | Redis 新增键 `pay:idempotency:{orderId}:{userId}` = `"PROCESSING"`，TTL=60s |

#### S4：预占库存

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `InventoryService.preDeductBatch` |
| 触发条件 | S3 幂等锁建立成功 |
| 输入数据 | `skuList`（来自 `OrderDO`，含 `skuId`(Long), `quantity`(Integer)）, `orderId`（用于日志关联） |
| 处理逻辑 | ① 遍历 `skuList`，对每个 SKU：② 获取分布式锁 `lockKey = "inventory:lock:" + skuId`，调用 `redisTemplate.opsForValue().setIfAbsent(lockKey, threadId, 10, SECONDS)` ③ if 加锁失败 → 自旋等待，最多重试 3 次，每次间隔 100ms → 仍失败 → 抛 `INVENTORY_LOCK_TIMEOUT(4001)` ④ 调用 `inventoryService.getAvailableStock(skuId)` 获取可用库存 ⑤ if 可用库存 < `quantity` → 释放当前锁，抛 `INSUFFICIENT_STOCK(4002)`（携带 `skuId` + 当前库存量） ⑥ 调用 `inventoryService.preDeduct(skuId, quantity, orderId)`：`available_stock -= quantity`, `locked_stock += quantity` ⑦ 写入 `inventory_lock_records`（skuId, orderId, quantity, lockType=`PRE_DEDUCT`, expireTime=createTime+30min） ⑧ 释放分布式锁 ⑨ 所有 SKU 预扣成功 → 继续 ⑩ 中途任意 SKU 失败 → 遍历已预扣列表逐一调用 `inventoryService.rollbackPreDeduct(skuId, quantity, orderId)` 回滚 |
| 调用依赖 | `redisTemplate.opsForValue().setIfAbsent(...)` → `Boolean`；`inventoryService.getAvailableStock(Long skuId)` → `Integer`；`inventoryService.preDeduct(Long skuId, Integer quantity, Long orderId)` → `Boolean`；`inventoryService.rollbackPreDeduct(Long skuId, Integer quantity, Long orderId)` → `Boolean`；`inventoryLockRecordService.insert(InventoryLockRecordDO)` → `int` |
| 异常处理 | `INVENTORY_LOCK_TIMEOUT` → `Result.fail(4001, "系统繁忙，请稍后重试")` + 释放 S3 幂等锁；`INSUFFICIENT_STOCK` → `Result.fail(4002, "商品库存不足", insufficientSkuList)` + 释放 S3 幂等锁；DB 写入失败 → 抛 `DB_ERROR(9002)` + 回滚所有已预扣库存 + 释放幂等锁 |
| 输出数据 | 预扣成功确认，含每个 SKU 的预扣记录 ID 列表 |
| 状态变更 | `inventory` 表：`available_stock` 减少, `locked_stock` 增加；`inventory_lock_records` 新增预扣记录 |

#### S5：创建支付记录

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentService.createPaymentRecord` |
| 触发条件 | S4 库存预扣成功 |
| 输入数据 | `orderId`, `userId`, `totalAmount`(BigDecimal), `payChannel` |
| 处理逻辑 | ① 生成支付记录 ID：`paymentId = snowflakeIdGenerator.nextId()` ② 生成外部支付号：`externalNo = "PAY" + yyyyMMdd + snowflakeId 后 8 位` ③ 构建 `PaymentRecordDO`（status=`INIT`, expireTime=createTime+30min） ④ 调用 `paymentRecordService.insert(paymentRecordDO)` 写入 `payment_records` 表 ⑤ if 插入失败（唯一键冲突）→ 重新生成 `externalNo`，最多重试 3 次 → 仍失败 → 抛 `DB_ERROR(9002)` |
| 调用依赖 | `snowflakeIdGenerator.nextId()` → `Long`；`paymentRecordService.insert(PaymentRecordDO record)` → `int` |
| 异常处理 | DB 插入失败 → 重试 3 次 → 仍失败 → 抛 `DB_ERROR(9002)` + 回滚 S4 库存预扣 + 释放 S3 幂等锁 |
| 输出数据 | `PaymentRecordDO`（`paymentId`, `externalNo`, status=`INIT`） |
| 状态变更 | `payment_records` 表新增行，status=`INIT` |

#### S6：调用支付渠道预下单

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentChannelService.createPreOrder` |
| 触发条件 | S5 支付记录创建成功 |
| 输入数据 | `externalNo`, `totalAmount`, `payChannel`, `subject`（订单商品摘要）, `notifyUrl`（回调地址） |
| 处理逻辑 | ① if `payChannel` = `ALIPAY` → 构建 `AlipayTradeCreateRequest`（out_trade_no=`externalNo`, total_amount=`totalAmount`, subject, timeout_express=30m） → 调用 `alipayClient.execute(request)` → 获取 `tradeNo` ② if `payChannel` = `WECHAT` → 构建 `WxPayUnifiedOrderRequest`（out_trade_no=`externalNo`, total_fee=`totalAmount`×100, trade_type=JSAPI, openid） → 调用 `wxPayService.unifiedOrder(request)` → 获取 `prepayId` ③ if 渠道返回失败 → 抛 `CHANNEL_PRE_ORDER_FAILED(5001)` ④ if 渠道超时（>10s）→ 抛 `CHANNEL_TIMEOUT(5002)` ⑤ 调用 `paymentRecordService.updateExternalTradeNo(paymentId, tradeNo/prepayId)` 持久化渠道交易号 |
| 调用依赖 | `alipayClient.execute(AlipayTradeCreateRequest)` → `AlipayTradeCreateResponse`；`wxPayService.unifiedOrder(WxPayUnifiedOrderRequest)` → `WxPayUnifiedOrderResult`；`paymentRecordService.updateExternalTradeNo(Long paymentId, String externalTradeNo)` → `int` |
| 异常处理 | `CHANNEL_PRE_ORDER_FAILED` → `Result.fail(5001, "支付渠道下单失败")` + 回滚 S4 库存 + 关闭 S5 支付记录（status=`CLOSED`）+ 释放幂等锁；`CHANNEL_TIMEOUT` → 同上 + 记录渠道超时告警日志 |
| 输出数据 | 渠道预下单结果（`tradeNo` 或 `prepayId` + 支付参数 `paySign`/`nonceStr`/`timeStamp`） |
| 状态变更 | `payment_records` 表 `external_trade_no` 字段更新；记录渠道响应日志 |

#### S7：回调验签与数据校验

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentCallbackController.notify` → `PaymentCallbackService.verifyAndParse` |
| 触发条件 | 第三方支付渠道异步 POST 回调到 `notifyUrl` |
| 输入数据 | `payChannel`（从 URL 路径解析）, `rawBody`（原始请求体, 用于验签）, `headers`（含签名头） |
| 处理逻辑 | ① if `payChannel` = `ALIPAY` → 调用 `alipayClient.verifySign(rawBody, headers)` → if 验签失败 → 抛 `SIGN_VERIFY_FAILED(6001)` ② if `payChannel` = `WECHAT` → 调用 `wxPayService.verifySign(rawBody, headers)` → if 验签失败 → 抛 `SIGN_VERIFY_FAILED(6001)` ③ 解析回调数据获取 `outTradeNo`(= `externalNo`), `tradeStatus`/`resultCode`, `totalAmount` ④ 调用 `paymentRecordService.getByExternalNo(outTradeNo)` 查支付记录 ⑤ if 记录不存在 → 抛 `PAYMENT_RECORD_NOT_FOUND(6002)` ⑥ if 记录 status ≠ `INIT` → 幂等返回成功（已处理过） ⑦ if 回调金额 ≠ 记录金额 → 抛 `AMOUNT_MISMATCH(6003)`（疑似篡改，告警） |
| 调用依赖 | `alipayClient.verifySign(String rawBody, Map headers)` → `Boolean`；`wxPayService.verifySign(String rawBody, Map headers)` → `Boolean`；`paymentRecordService.getByExternalNo(String externalNo)` → `PaymentRecordDO` |
| 异常处理 | `SIGN_VERIFY_FAILED` → 返回渠道对应失败响应（Alipay: `failure`; WeChat: `<return_code>FAIL</return_code>`）+ 记录安全告警日志，**不回滚任何业务**；`PAYMENT_RECORD_NOT_FOUND` → 返回失败响应 + 告警；`AMOUNT_MISMATCH` → 返回失败响应 + 安全告警 + 人工冻结订单 |
| 输出数据 | 验签通过的 `PaymentRecordDO` + 渠道交易状态（`TRADE_SUCCESS` / `SUCCESS`） |
| 状态变更 | 无（校验阶段不改状态） |

#### S8：支付成功状态更新与库存确认

| 字段 | 内容 |
|------|------|
| 执行角色 | 后端 `PaymentCallbackService.handleSuccess` |
| 触发条件 | S7 验签通过且渠道返回支付成功 |
| 输入数据 | `PaymentRecordDO`（含 `paymentId`, `orderId`, `totalAmount`） |
| 处理逻辑 | ① 开启 DB 事务 ② 调用 `paymentRecordService.updateStatus(paymentId, SUCCESS)` → 更新支付记录状态 ③ 调用 `orderService.updateStatus(orderId, PAID)` → 更新订单状态 ④ 遍历订单 `skuList`，对每个 SKU 调用 `inventoryService.confirmDeduct(skuId, quantity, orderId)`：`locked_stock -= quantity`, `sold_stock += quantity` ⑤ 调用 `transactionFlowService.insert(TransactionFlowDO)` 生成交易流水 ⑥ 提交事务 ⑦ if 事务提交失败 → 回滚全部（支付记录不变、订单不变、库存不变），返回渠道失败响应，触发补偿任务 ⑧ 更新幂等键值：`redisTemplate.opsForValue().set(idempotencyKey, "SUCCESS", 86400, SECONDS)` ⑨ 异步发送通知：`messageQueueService.send("payment-success", { orderId, userId, amount })` |
| 调用依赖 | `paymentRecordService.updateStatus(Long paymentId, PaymentStatus status)` → `int`；`orderService.updateStatus(Long orderId, OrderStatus status)` → `int`；`inventoryService.confirmDeduct(Long skuId, Integer quantity, Long orderId)` → `Boolean`；`transactionFlowService.insert(TransactionFlowDO)` → `int`；`redisTemplate.opsForValue().set(String key, String value, long timeout, TimeUnit unit)`；`messageQueueService.send(String topic, Object payload)` |
| 异常处理 | 事务回滚 → 返回渠道失败响应 + 写入 `payment_compensation` 表（待补偿）+ 告警；幂等键更新失败 → 不影响主流程（有 DB 事务保证），仅告警；MQ 发送失败 → 不影响主流程，补偿任务重发 |
| 输出数据 | 返回渠道成功响应（Alipay: `success`; WeChat: `<return_code>SUCCESS</return_code><return_msg>OK</return_msg>`） |
| 状态变更 | `payment_records` status → `SUCCESS`；`orders` status → `PAID`；`inventory` `locked_stock` 减少, `sold_stock` 增加；`transaction_flows` 新增流水；Redis 幂等键值 → `"SUCCESS"` |

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl POST /pay（待支付订单）→200+payParams ✅ · 重复 POST→3001 ✅ · 库存不足订单→4002 ✅ · 模拟 Alipay 回调→验签通过+订单 PAID ✅ · 验签失败→丢弃+告警 ✅ |
