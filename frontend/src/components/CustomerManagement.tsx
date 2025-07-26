import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, List } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import AddressParser from './AddressParser';
import { API_BASE_URL } from '../services/api';

interface Customer {
  id: number;
  name: string;
  pinyin: string;
  wechat: string;
  phone: string;
  default_address: string;
  address_history: string[];
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
  const [balanceInfo, setBalanceInfo] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [transactionForm] = Form.useForm();

  const fetchCustomers = async (name?: string, phone?: string, order?: string) => {
    try {
      setLoading(true);
      setError(null);
      let url = `${API_BASE_URL}/api/customers`;
      const params = new URLSearchParams();
      
      if (name) {
        params.append('name', name);
      }
      if (phone) {
        params.append('phone', phone);
      }
      if (order) {
        params.append('order', order === 'ascend' ? 'asc' : 'desc');
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      setError('获取客户列表失败');
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(nameFilter, phoneFilter, sortOrder === 'descend' ? 'desc' : 'asc');
  }, [nameFilter, phoneFilter, sortOrder]);

  const handleAddressSelected = async (addressInfo: any) => {
    if (selectedCustomer) {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ address: addressInfo }),
        });

        if (!response.ok) throw new Error('Failed to update address');
        
        message.success('地址更新成功');
        fetchCustomers();
      } catch (error) {
        setError('更新地址失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to create customer');

      message.success('客户创建成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      setError('创建客户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete customer');

      message.success('客户删除成功');
      fetchCustomers();
    } catch (error) {
      setError('删除客户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to update customer');

      message.success('客户更新成功');
      setIsUpdateModalVisible(false);
      updateForm.resetFields();
      fetchCustomers();
    } catch (error) {
      setError('更新客户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    
    try {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 确保文本区域在视觉上不可见
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // 执行复制命令
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        message.success('已复制到剪贴板');
      } else {
        message.error('复制失败');
      }
    } catch (err) {
      console.error('复制失败，详细错误:', err);
      message.error('复制失败');
    }
  };

  const showUpdateModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    updateForm.setFieldsValue(customer);
    setIsUpdateModalVisible(true);

    // 获取余额与交易记录
    fetch(`${API_BASE_URL}/api/customers/${customer.id}/balance`)
      .then(res => res.json())
      .then(data => setBalanceInfo(data))
      .catch(() => {});
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索姓名(支持中文和拼音)"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              setNameFilter(selectedKeys[0] || '');
            }}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                setNameFilter(selectedKeys[0] || '');
              }}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setNameFilter('');
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      sorter: true,
      sortOrder: sortOrder,
      onHeaderCell: () => ({
        onClick: () => {
          setSortOrder((current) => {
            if (!current) return 'ascend';
            if (current === 'ascend') return 'descend';
            return null;
          });
        },
      }),
      render: (name: string, record: Customer) => (
        <Space>
          <span title={`拼音: ${record.pinyin}`}>{name}</span>
          <CopyOutlined onClick={() => handleCopy(name)} className="cursor-pointer text-gray-400 hover:text-blue-500" />
        </Space>
      ),
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      render: (wechat: string) => (
        <Space>
          <span>{wechat}</span>
          <CopyOutlined onClick={() => handleCopy(wechat)} className="cursor-pointer text-gray-400 hover:text-blue-500" />
        </Space>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索电话号码"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              setPhoneFilter(selectedKeys[0] || '');
            }}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                setPhoneFilter(selectedKeys[0] || '');
              }}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                setPhoneFilter('');
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
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          data-icon="search"
          width="1em"
          height="1em"
          fill={filtered ? '#1890ff' : undefined}
          aria-hidden="true"
        >
          <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
        </svg>
      ),
      render: (phone: string) => (
        <Space>
          <span>{phone}</span>
          <CopyOutlined onClick={() => handleCopy(phone)} className="cursor-pointer text-gray-400 hover:text-blue-500" />
        </Space>
      ),
    },
    {
      title: '默认地址',
      dataIndex: 'default_address',
      key: 'default_address',
      render: (address: string) => (
        <Space>
          <span title={address}>{address && address.length > 3 ? `${address.substring(0, 3)}...` : address}</span>
          <CopyOutlined onClick={() => handleCopy(address)} className="cursor-pointer text-gray-400 hover:text-blue-500" />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button onClick={() => showUpdateModal(record)}>
            <EditOutlined />
          </Button>
          <Popconfirm
            title="确定删除吗?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">客户管理</h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          添加客户
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <AddressParser 
          onAddressSelected={handleAddressSelected} 
          onAddressParseSuccess={() => fetchCustomers(nameFilter, phoneFilter, sortOrder === 'descend' ? 'desc' : 'asc')} 
        />
      </div>

      <div>
        {loading ? (
          <div className="p-4 text-center">加载中...</div>
        ) : (
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </div>

      <Modal
        title="新增客户"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <AddressParser 
          onAddressSelected={handleAddressSelected} 
          onAddressParseSuccess={() => fetchCustomers(nameFilter, phoneFilter, sortOrder === 'descend' ? 'desc' : 'asc')} 
        />
      </Modal>

      <Modal
        title="更新客户"
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        footer={null}
      >
        <Form form={updateForm} onFinish={handleUpdate} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="wechat"
            label="微信号"
            rules={[{ message: '请输入微信号' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="default_address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码' }
            ]}
          >
            <Input maxLength={11} placeholder="请输入11位手机号码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>

        {/* 余额信息展示 */}
        <h3>余额: ￥{balanceInfo.balance.toFixed(2)}</h3>
        <List
          size="small"
          bordered
          dataSource={balanceInfo.transactions}
          renderItem={(item: any, index) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  danger 
                  size="small"
                  onClick={async () => {
                    if (!selectedCustomer) return;
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/balance/${item.id}`, {
                        method: 'DELETE',
                      });
                      if (!res.ok) throw new Error('failed');
                      const data = await res.json();
                      setBalanceInfo(prev => ({ 
                        ...prev, 
                        balance: data.balance, 
                        transactions: data.transactions 
                      }));
                      message.success('删除成功');
                    } catch (err) {
                      message.error('删除失败');
                    }
                  }}
                >
                  删除
                </Button>
              ]}
            >
              {index + 1}. ￥{item.amount} 备注: {item.note || '—'}
            </List.Item>
          )}
          style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}
        />

        {/* 添加充值/消费 */}
        <Form form={transactionForm} layout="inline" onFinish={async (values) => {
          if (!selectedCustomer) return;
          try {
            const res = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/balance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            setBalanceInfo(prev => ({ ...prev, balance: data.balance, transactions: [data.transaction, ...prev.transactions] }));
            transactionForm.resetFields();
          } catch (err) {
            message.error('操作失败');
          }
        }}>
          <Form.Item name="amount" rules={[{ required: true, message: '请输入金额' }]}>
            <Input placeholder="金额(正数充值,负数消费)" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="note">
            <Input placeholder="备注" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
