import { Form, Input, Modal, Select, message } from 'antd';
import React, { useEffect } from 'react';
import type { OrderFormValues, OrderListItem } from '../typings';

/** 订单详情弹窗 Props */
export interface OrderDetailModalProps {
  open: boolean;
  record?: OrderListItem;
  onCancel: () => void;
}

/** 订单状态选项 */
const STATUS_OPTIONS = [
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已取消', value: 'CANCELLED' },
];

/**
 * 订单详情弹窗（只读展示）
 * 对齐项目 Modal 模板：destroyOnClose + form.setFieldsValue
 */
const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ open, record, onCancel }) => {
  const [form] = Form.useForm<OrderFormValues>();

  /** 弹窗打开时回填表单 */
  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        orderNo: record.orderNo,
        customerName: record.customerName,
        amount: record.amount,
        status: record.status,
      });
    }
  }, [open, record, form]);

  /** 关闭弹窗 */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="订单详情"
      open={open}
      destroyOnClose
      footer={null}
      onCancel={handleCancel}
    >
      <Form form={form} layout="vertical" disabled>
        <Form.Item name="orderNo" label="订单号">
          <Input />
        </Form.Item>
        <Form.Item name="customerName" label="客户名称">
          <Input />
        </Form.Item>
        <Form.Item name="amount" label="金额">
          <Input />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderDetailModal;
