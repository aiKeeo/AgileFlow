# F-001 退款模块

## 接口

- `POST /order/{id}/refund`
  - 渠道：微信
  - 幂等：orderId + requestId

## 依赖

- 微信支付 SDK
