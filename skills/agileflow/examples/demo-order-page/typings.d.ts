/** 订单列表项 */
export interface OrderListItem {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

/** 订单状态枚举 */
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';

/** 订单列表查询参数 */
export interface OrderQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  status?: OrderStatus;
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[];
  total: number;
}

/** 订单表单值（编辑/详情展示用） */
export interface OrderFormValues {
  orderNo: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
}
