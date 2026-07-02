import { useRequest } from '@umijs/max';
import { Button, Form, Input, Modal, Select, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import OrderDetailModal from './components/OrderDetailModal';
import styles from './index.module.less';
import { cancelOrder, queryOrderList } from './service';
import type { OrderListItem, OrderQueryParams, OrderStatus } from './typings';

/** 订单状态选项（搜索用） */
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已取消', value: 'CANCELLED' },
];

/** 状态展示文案 */
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  CANCELLED: '已取消',
};

/**
 * 订单管理列表页
 * 演示：对齐 init patterns 中的 Form + Table + Modal + useRequest 模板
 */
const OrderListPage: React.FC = () => {
  const [form] = Form.useForm<Pick<OrderQueryParams, 'keyword' | 'status'>>();
  const [queryParams, setQueryParams] = useState<OrderQueryParams>({
    current: 1,
    pageSize: 10,
  });
  const [detailRecord, setDetailRecord] = useState<OrderListItem>();
  const [detailOpen, setDetailOpen] = useState(false);

  /** 列表请求：queryParams 变化时自动刷新 */
  const { data, loading, refresh } = useRequest(
    () => queryOrderList(queryParams),
    { refreshDeps: [queryParams] },
  );

  /** 提交搜索：重置到第一页 */
  const handleSearch = async () => {
    const values = await form.validateFields();
    setQueryParams((prev) => ({ ...prev, ...values, current: 1 }));
  };

  /** 重置搜索条件 */
  const handleReset = () => {
    form.resetFields();
    setQueryParams({ current: 1, pageSize: 10 });
  };

  /** 打开详情弹窗 */
  const openDetailModal = (record: OrderListItem) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  /** 关闭详情弹窗 */
  const closeDetailModal = () => {
    setDetailOpen(false);
    setDetailRecord(undefined);
  };

  /** 取消订单（带二次确认） */
  const handleCancelOrder = (record: OrderListItem) => {
    Modal.confirm({
      title: '确认取消订单？',
      content: `订单号：${record.orderNo}`,
      onOk: async () => {
        await cancelOrder(record.id);
        message.success('取消成功');
        refresh();
      },
    });
  };

  /** 表格列定义 */
  const columns: ColumnsType<OrderListItem> = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '客户名称', dataIndex: 'customerName' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (val: OrderStatus) => STATUS_LABEL[val],
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openDetailModal(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" danger onClick={() => handleCancelOrder(record)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /** 分页变更 */
  const handlePageChange = (current: number, pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, current, pageSize }));
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 搜索区：对齐 patterns 2.1 表单模板 */}
      <Form form={form} layout="inline" className={styles.searchForm}>
        <Form.Item name="keyword" label="关键词">
          <Input placeholder="订单号/客户名" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select options={STATUS_OPTIONS} placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 表格区：对齐 patterns 2.2 表格模板 */}
      <div className={styles.tableWrapper}>
        <Table<OrderListItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data?.list}
          pagination={{
            current: queryParams.current,
            pageSize: queryParams.pageSize,
            total: data?.total,
            showSizeChanger: true,
            onChange: handlePageChange,
          }}
        />
      </div>

      {/* 详情弹窗：对齐 patterns 2.3 Modal 模板 */}
      <OrderDetailModal open={detailOpen} record={detailRecord} onCancel={closeDetailModal} />
    </div>
  );
};

export default OrderListPage;
