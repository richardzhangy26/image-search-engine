import React, { useState, useEffect } from 'react';
import { Modal, Image, Select, message, Table, Button, Popconfirm, Space, Input, Upload, DatePicker, Form } from 'antd';
import { SearchOutlined, UploadOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import type { TablePaginationConfig, SorterResult, FilterValue, Key } from 'antd/es/table/interface';
import ExcelJS from 'exceljs';
import type { Dayjs } from 'dayjs';
import { updateOrderNotes } from '../services/api';

interface Order {
  id: string;
  customer_name: string;
  customer_id: string;
  products: {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
  }[];
  total_amount: number;
  status: 'unpaid' | 'paid' | 'unpurchased' | 'purchased' | 'unshipped' | 'shipped' | 'returned' | 'exchanged';
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  customer_phone?: string;
  tracking_number?: string;
  shipping_company?: string;
  internal_notes?: string;
  customer_notes?: string;
}


import { API_BASE_URL } from '../services/api';

interface OrderManagementProps {
  onEditOrder?: (order: Order) => void;
}

// 辅助函数：根据状态获取颜色类名
const getStatusClassName = (status: Order['status']) => {
  switch (status) {
    case 'unpaid':
      return 'bg-red-100 text-red-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'unpurchased':
      return 'bg-yellow-100 text-yellow-800';
    case 'purchased':
      return 'bg-blue-100 text-blue-800';
    case 'unshipped':
      return 'bg-purple-100 text-purple-800';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800';
    case 'returned':
      return 'bg-orange-100 text-orange-800'; // 新增退货颜色
    case 'exchanged':
      return 'bg-teal-100 text-teal-800';    // 新增换货颜色
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const OrderManagement: React.FC<OrderManagementProps> = ({ onEditOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [customerIdSearch, setCustomerIdSearch] = useState('');
  const [isEditNotesVisible, setIsEditNotesVisible] = useState(false);
  const [editCustomerNotes, setEditCustomerNotes] = useState('');
  const [editInternalNotes, setEditInternalNotes] = useState('');

  // 获取订单列表
  const fetchOrders = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pageSize.toString()
      });

      // 如果有状态筛选，添加到查询参数
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      // 如果有日期范围筛选，添加到查询参数
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
      }

      // 排序参数
      if (sortField) {
        params.append('sort', sortField);
      }
      if (sortOrder) {
        params.append('order', sortOrder === 'ascend' ? 'asc' : 'desc');
      }

      // 客户ID搜索参数
      if (customerIdSearch && customerIdSearch.trim() !== '') {
        params.append('customer_id', customerIdSearch.trim());
      }


      const response = await fetch(`${API_BASE_URL}/api/orders?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('获取订单列表失败');
      }
      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(prev => ({
        ...prev,
        current: data.current_page,
        pageSize: pageSize,
        total: data.total
      }));
    } catch (error) {
      console.error('获取订单失败:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表格变化（排序、分页）
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, (string | number | boolean)[] | null>,
    sorter: SorterResult<Order> | SorterResult<Order>[]
  ) => {
    // 处理状态筛选
    const statusFilterValue = filters.status?.[0] as string;
    setStatusFilter(statusFilterValue || '');

    // 处理分页
    const newPagination = {
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      total: pagination.total || 0
    };
    setPagination(newPagination);

    // 处理排序
    if (!Array.isArray(sorter)) {
      const { field, order } = sorter;
      setSortField(field as string);
      setSortOrder(order as 'ascend' | 'descend');
    }

    // 重新获取数据
    fetchOrders(newPagination.current, newPagination.pageSize);
  };

  // 处理订单创建
  const handleOrderCreate = async (orderData: any) => {
    try {
      // 刷新订单列表
      await fetchOrders();
      message.success('订单创建成功');
    } catch (error) {
      console.error('创建订单失败:', error);
      message.error('创建订单失败');
    }
  };

  // 删除订单
  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '删除订单失败');
      }

      message.success('订单删除成功');
      // 重新加载订单列表
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      if (error instanceof Error) {
        console.error('删除订单时出错:', error);
        message.error(error.message);
      } else {
        message.error('删除订单失败');
      }
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('更新状态失败');
      }

      // 刷新订单列表
      fetchOrders();
      message.success('订单状态更新成功');
    } catch (error) {
      console.error('更新订状态时出错:', error);
      message.error('更新订单状态失败');
    }
  };

  // 搜索处理函数
  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  // 一键重置全部筛选条件
  const handleResetAllFilters = () => {
    setStatusFilter('');
    setDateRange(null);
    setSearchText('');
    setSearchedColumn('');
    setSelectedRowKeys([]);
    setCustomerIdSearch('');
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchOrders(1, pagination.pageSize);
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={
            dataIndex === 'customer_info' ? '搜索姓名、电话、地址' : 
            dataIndex === 'customer_id' ? '搜索客户ID' :
            `搜索 ${dataIndex}`
          }
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string | Key | boolean, record: Order) => {
      if (typeof value === 'string') {
        if (dataIndex === 'customer_info') {
          return (
            record.customer_name?.toString().toLowerCase().includes(value.toLowerCase()) ||
            record.customer_phone?.toString().toLowerCase().includes(value.toLowerCase()) ||
            record.shipping_address?.toString().toLowerCase().includes(value.toLowerCase())
          );
        } else if (dataIndex === 'customer_id') {
          return record.customer_id?.toString().toLowerCase().includes(value.toLowerCase());
        }
      }
      return false;
    },
    filteredValue: searchedColumn === dataIndex ? [searchText] : null,
  });

  const columns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>订单编号</span>
          <Button
            size="small"
            type="text"
            icon={sortField === 'id' && sortOrder === 'ascend' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => {
              setSortField('id');
              setSortOrder(prev => (prev === 'ascend' ? 'descend' : 'ascend'));
              fetchOrders(1, pagination.pageSize);
            }}
            style={{ 
              color: sortField === 'id' ? '#1890ff' : '#666',
              padding: '2px 4px',
              minWidth: 'auto'
            }}
          />
        </div>
      ),
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: Order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{text}</div>
          {record.internal_notes && (
            <div className="text-sm text-gray-500">备注: {record.internal_notes}</div>
          )}
        </div>
      ),
    },
    {
      title: '客户ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索客户ID"
            value={selectedKeys[0] || customerIdSearch}
            onChange={e => {
              const value = e.target.value;
              setSelectedKeys(value ? [value] : []);
              // 实时更新状态，避免不同步
              if (value !== customerIdSearch) {
                setCustomerIdSearch(value);
              }
            }}
            onPressEnter={() => {
              const value = (selectedKeys[0] || '').toString();
              setCustomerIdSearch(value);
              confirm();
              // 立即触发搜索，不依赖useEffect
              fetchOrders(1, pagination.pageSize);
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                const value = (selectedKeys[0] || '').toString();
                setCustomerIdSearch(value);
                confirm();
                // 立即触发搜索，不依赖useEffect
                fetchOrders(1, pagination.pageSize);
              }}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                if (clearFilters) clearFilters();
                setSelectedKeys([]);
                setCustomerIdSearch('');
                confirm();
                // 立即触发搜索，不依赖useEffect
                fetchOrders(1, pagination.pageSize);
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered || !!customerIdSearch ? '#1890ff' : undefined }} />
      ),
      filteredValue: customerIdSearch ? [customerIdSearch] : null,
      render: (text: string, record: Order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{text}</div>
          {(record.customer_notes || record.internal_notes) && (
            <div className="text-sm text-gray-500">客户备注: {record.customer_notes || record.internal_notes}</div>
          )}
        </div>
      ),
    },
    {
      title: '用户信息',
      dataIndex: 'customer_info',
      key: 'customer_info',
      ...getColumnSearchProps('customer_info'),
      render: (text: string, record: Order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{record.customer_name}</div>
          {record.customer_phone && (
            <div className="text-sm text-gray-500">
              电话: {record.customer_phone}
            </div>
          )}
          {record.shipping_address && (
            <div className="text-sm text-gray-500">
              地址: {record.shipping_address}
            </div>
          )}
          {record.shipping_company && (
            <div className="text-sm text-gray-500">
              快递公司: {record.shipping_company}
            </div>
          )}
          {record.tracking_number && (
            <div className="text-sm text-gray-500">
              运单号: {record.tracking_number}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '商品信息',
      dataIndex: 'products',
      key: 'products',
      render: (products: Order['products']) => (
        <div className="space-y-2">
          {products.map((product, idx) => (
            <div key={idx} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
              <div className="font-medium text-gray-900">{product.name}</div>
              <div className="text-gray-500">
                <span className="mr-2">ID: {product.product_id}</span>{', '}
                <span className="mr-2">{product.size || '无'}</span>{', '}
                <span className="mr-2">{product.color || '无'}</span>{', '}
                <span className="mr-2">{product.quantity}</span>{', '}
                <span>¥{product.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (text: number, record: Order) => (
        <div>
          <div className="text-sm text-gray-900">¥{text.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{record.products.length} 件商品</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filterMode: 'menu',
      filters: [
        { text: '未付款', value: 'unpaid' },
        { text: '已付款', value: 'paid' },
        { text: '未采购', value: 'unpurchased' },
        { text: '已采购', value: 'purchased' },
        { text: '未发货', value: 'unshipped' },
        { text: '已发货', value: 'shipped' },
        { text: '退货', value: 'returned' },
        { text: '换货', value: 'exchanged' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
      onFilter: (value: string, record: Order) => {
        return record.status === value;
      },
      render: (text: Order['status'], record: Order) => (
        <select
          value={text}
          onChange={(e) => handleStatusChange(parseInt(record.id), e.target.value)}
          className={`px-2 py-1 text-sm rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 ${
            text === 'unpaid'
              ? 'bg-red-100 text-red-800'
              : text === 'paid'
              ? 'bg-green-100 text-green-800'
              : text === 'unpurchased'
              ? 'bg-yellow-100 text-yellow-800'
              : text === 'purchased'
              ? 'bg-blue-100 text-blue-800'
              : text === 'unshipped'
              ? 'bg-purple-100 text-purple-800'
              : text === 'shipped'
              ? 'bg-indigo-100 text-indigo-800'
              : text === 'returned'
              ? 'bg-orange-100 text-orange-800'
              : text === 'exchanged'
              ? 'bg-teal-100 text-teal-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <option value="unpaid">未付款</option>
          <option value="paid">已付款</option>
          <option value="unpurchased">未采购</option>
          <option value="purchased">已采购</option>
          <option value="unshipped">未发货</option>
          <option value="shipped">已发货</option>
          <option value="returned">退货</option>
          <option value="exchanged">换货</option>
        </select>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              if (dates) {
                setSelectedKeys([`${dates[0]?.format('YYYY-MM-DD')}_${dates[1]?.format('YYYY-MM-DD')}`]);
              } else {
                setSelectedKeys([]);
              }
            }}
            format="YYYY-MM-DD"
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                fetchOrders(1); // 重新加载第一页数据
              }}
              size="small"
              style={{ width: 90 }}
            >
              筛选
            </Button>
            <Button
              onClick={() => {
                if (clearFilters) {
                  clearFilters();
                }
                setDateRange(null);
                setSelectedKeys([]);
                fetchOrders(1); // 重新加载第一页数据
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      render: (text: string) => (
        <div className="text-sm text-gray-500">{new Date(text).toLocaleString('zh-CN')}</div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setSelectedOrder(record);
              setIsModalVisible(true);
            }}
          >
            预览
          </Button>
          <Button
            type="link"
            onClick={() => openEditNotesModal(record)}
          >
            编辑备注
          </Button>
          <Popconfirm
            title="确定要删除这个订单吗？"
            description="删除后将无法恢复！"
            onConfirm={() => handleDeleteOrder(parseInt(record.id))}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 生成订单文本
  const generateOrderText = (order: Order) => {
    const lines = [
      `订单编号：${order.id}`,
      `----------------------------------------------------------`,
      `收件人姓名：${order.customer_name}`,
      `联系方式：${order.customer_phone || ''}`,
      `收件地址：${order.shipping_address || ''}`,
      `-----------------------------------------------------------`,
    ];

    // 添加商品信息
    const products = order.products || [];
    products.forEach((product, index) => {
      lines.push(
        `商品ID：${product.product_id}`,
        `销售属性：${product.color || ''} ${product.size || ''}`,
        `数量：${product.quantity}`,
        `价格：${product.price} 元`,
      );
    });

    // 添加分隔线和总计
    lines.push(
      `---------------------------------------------`,
      `总计：${order.total_amount} 元`,
      ``,
      `订单状态：${order.status === 'shipped' ? '已发货' : 
                   order.status === 'unshipped' ? '未发货' :
                   order.status === 'purchased' ? '已采购' :
                   order.status === 'unpurchased' ? '未采购' :
                   order.status === 'paid' ? '已付款' :
                   order.status === 'returned' ? '退货' :
                   order.status === 'exchanged' ? '换货' : '未付款'}`,
      `客户备注：${order.customer_notes || ''}`,
      `快递单号：${order.internal_notes|| ''}`
    );

    return lines.join('\n');
  };

  // 复制订单信息
  const copyOrderInfo = (order: Order) => {
    const text = generateOrderText(order);
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('订单信息已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
        // 创建一个临时文本区域作为后备方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          message.success('订单信息已复制到剪贴板');
        } catch (err) {
          message.error('复制失败');
        }
        document.body.removeChild(textarea);
      });
  };

  const renderOrderPreviewModal = () => {
    if (!selectedOrder) return null;

    const getStatusText = (status: Order['status']) => {
      switch (status) {
        case 'unpaid': return '未付款';
        case 'paid': return '已付款';
        case 'unpurchased': return '未采购';
        case 'purchased': return '已采购';
        case 'unshipped': return '未发货';
        case 'shipped': return '已发货';
        case 'returned': return '退货';
        case 'exchanged': return '换货';
        default: return status;
      }
    };

    const previewText = generateOrderText(selectedOrder);

    return (
      <Modal
        title="订单预览"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="copy" onClick={() => copyOrderInfo(selectedOrder)}>
            复制订单信息
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ 
          fontFamily: 'monospace', 
          whiteSpace: 'pre-line', 
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {previewText}
        </div>
      </Modal>
    );
  };

  // 打开编辑备注 Modal
  function openEditNotesModal(order: Order) {
    setSelectedOrder(order);
    setEditCustomerNotes(order.customer_notes || '');
    setEditInternalNotes(order.internal_notes || '');
    setIsEditNotesVisible(true);
  }

  // 保存备注
  async function handleSaveNotes() {
    if (!selectedOrder) return;
    try {
      await updateOrderNotes(selectedOrder.id, {
        customer_notes: editCustomerNotes,
        internal_notes: editInternalNotes,
      });
      message.success('备注已更新');
      setIsEditNotesVisible(false);
      // 重新加载订单列表以显示最新数据
      fetchOrders(pagination.current);
    } catch (error) {
      message.error((error as Error).message || '更新失败');
    }
  }

  const renderEditNotesModal = () => {
    if (!selectedOrder) return null;
    return (
      <Modal
        title={`编辑备注 - 订单 ${selectedOrder.id}`}
        open={isEditNotesVisible}
        onCancel={() => setIsEditNotesVisible(false)}
        onOk={handleSaveNotes}
      >
        <Form layout="vertical">
          <Form.Item label="客户备注">
            <Input.TextArea
              value={editCustomerNotes}
              onChange={(e) => setEditCustomerNotes(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="内部备注">
            <Input.TextArea
              value={editInternalNotes}
              onChange={(e) => setEditInternalNotes(e.target.value)}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // 处理导出订单
  const handleExportOrders = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的订单');
      return;
    }

    try {
      // 准备导出数据
      const selectedOrders = orders.filter(order => selectedRowKeys.includes(order.id));
      const exportData = selectedOrders.map(order => {
        const products = order.products || [];
        return products.map(product => ({
          orderNumber: order.id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone || '',
          shippingAddress: order.shipping_address || '',
          notes: order.customer_notes || '',
          productCode: product.product_id,
          productName: product.product_name,
          attributes: `${product.color || ''}, ${product.size || ''}`.replace(/^, |, $/, '').trim() || '无',
          quantity: product.quantity
        }));
      }).flat(); // 展平数组，因为一个订单可能包含多个产品

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单数据');
      
      // 定义列
      worksheet.columns = [
        { header: '订单ID', key: 'orderNumber', width: 20 },
        { header: '收件人姓名', key: 'customerName', width: 15 },
        { header: '收件人联系方式', key: 'customerPhone', width: 20 },
        { header: '收件人地址', key: 'shippingAddress', width: 30 },
        { header: '备注', key: 'notes', width: 20 },
        { header: '商品ID', key: 'productCode', width: 15 },
        { header:'商品名称',key:'productName',width:20 },
        { header: '商品属性', key: 'attributes', width: 20 },
        { header: '数量', key: 'quantity', width: 10 }
      ];
      
      // 添加数据
      worksheet.addRows(exportData);
      
      // 设置样式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      
      // 导出文件
      const fileName = `订单导出_${new Date().toLocaleDateString()}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 处理导入订单
  const handleImportOrders = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || '导入失败');
      }

      message.success(data.detail || `导入完成：成功 ${data.success_count} 条，失败 ${data.error_count} 条`);
      
      if (data.errors?.length > 0) {
        Modal.warning({
          title: '导入结果',
          width: 600,
          content: (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>成功导入：</strong> {data.success_count} 条
                <br />
                <strong>导入失败：</strong> {data.error_count} 条
              </div>
              {data.error_count > 0 && (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff4d4f' }}>
                    失败详情：
                  </div>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {data.errors.map((error: string, i: number) => (
                      <li key={i} style={{ marginBottom: '4px', color: '#666' }}>
                        <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                          {error}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ),
        });
      }
      
      fetchOrders(); // 刷新列表
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败：' + (error as Error).message);
    }
  };

  // 使用 useEffect 监听 statusFilter 和 dateRange 变化，customerIdSearch 通过按钮触发
  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, dateRange]);

  // 初始加载
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h2>订单管理</h2>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Button type="primary" onClick={() => fetchOrders()}>
          刷新列表
        </Button>
        <Upload
          accept=".xlsx"
          showUploadList={false}
          beforeUpload={(file) => {
            handleImportOrders(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>导入订单</Button>
        </Upload>
        <Button 
          type="primary" 
          onClick={handleExportOrders}
          disabled={selectedRowKeys.length === 0}
        >
          导出所选订单
        </Button>
        <Button onClick={handleResetAllFilters}>重置筛选</Button>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
          }
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />
      {renderOrderPreviewModal()}
      {renderEditNotesModal()}
    </div>
  );
};

export default OrderManagement;
