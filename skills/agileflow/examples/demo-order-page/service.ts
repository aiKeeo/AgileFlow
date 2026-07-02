import { request } from '@umijs/max';
import type { OrderListItem, OrderQueryParams, PageResult } from './typings';

/**
 * 分页查询订单列表
 * @param params 查询参数（含分页）
 */
export async function queryOrderList(params: OrderQueryParams) {
  return request<PageResult<OrderListItem>>('/api/orders', {
    method: 'GET',
    params,
  });
}

/**
 * 取消订单
 * @param orderId 订单 ID
 */
export async function cancelOrder(orderId: string) {
  return request<void>(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
  });
}

/**
 * 获取订单详情
 * @param orderId 订单 ID
 */
export async function getOrderDetail(orderId: string) {
  return request<OrderListItem>(`/api/orders/${orderId}`, {
    method: 'GET',
  });
}
