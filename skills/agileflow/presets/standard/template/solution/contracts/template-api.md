---
target: solution/contracts/API-*.md
---

# [API-001] 接口名

- 关联功能：[F-001](../features/F-001-*.md)
- 类型：HTTP POST | Local Service
- 路径：`POST /api/...` 或 模块：`services/xxxService.js`
- 鉴权：Bearer / 无 / 见 [_common.md](_common.md)

> **写法铁律**：入参/出参必须用 `jsonc` 代码块 + 示例值；嵌套 object 先在「## 数据模型」展开，禁止表格 inline `{ a, b }` 或「见下」。

## 数据模型

> 有嵌套 object 或跨方法复用的 DTO 时必填；HTTP 单接口若仅一层可省略。

### XxxDto

| 字段 | 类型 | 说明 |
|------|------|------|
| fieldA | string | 说明 |
| nested | NestedDto \| null | 见 NestedDto |

### NestedDto

| 字段 | 类型 | 说明 |
|------|------|------|
| subField | number | 说明 |

---

## HTTP 单接口写法

### 请求体

```jsonc
{
  "fieldA": "alice",       // 必填，1–32，trim
  "fieldB": 123            // 可选；默认 0
}
```

### 字段规则

| 字段 | 规则 |
|------|------|
| fieldA | 必填，1–32，trim |
| fieldB | 可选，≥ 0 |

### 成功响应

```jsonc
{
  "code": 0,
  "data": {
    "id": "rec_001",
    "fieldA": "alice",
    "nested": {
      "subField": 42
    }
  }
}
```

### 失败响应

```jsonc
{
  "code": 40001,
  "message": "参数缺失/格式非法"
}
```

---

## Local Service 多方法写法

## 方法一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `methodName` | `local://service/domain/action` | 说明 |

---

## methodName

- **路径**：`local://service/domain/action`

### 请求

```jsonc
{
  "fieldA": "2026-07-19"    // 可选，默认今天；YYYY-MM-DD
}
```

### 成功响应

```jsonc
{
  "ok": true,
  "data": {
    "fieldA": "2026-07-19",
    "nested": {
      "subField": 42
    }
  }
}
```

### 失败响应

```jsonc
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入参不合法"
  }
}
```

### 字段规则

| 字段 | 规则 |
|------|------|
| fieldA | 可选；缺省=今天 |

## 错误码

| code / HTTP | 说明 | 场景 |
|-------------|------|------|
| `VALIDATION_ERROR` / 400 | 入参不合法 | 字段校验失败 |
| `STORAGE_ERROR` / 500 | 存储失败 | 读写异常 |
