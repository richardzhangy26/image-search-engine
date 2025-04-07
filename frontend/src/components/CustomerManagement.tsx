import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import AddressParser from './AddressParser';

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
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);

  const fetchCustomers = async (name?: string, order?: string) => {
    try {
      setLoading(true);
      setError(null);
      let url = 'http://localhost:5000/api/customers';
      const params = new URLSearchParams();
      
      if (name) {
        params.append('name', name);
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
    fetchCustomers(nameFilter, sortOrder === 'descend' ? 'desc' : 'asc');
  }, [nameFilter, sortOrder]);

  const handleAddressSelected = async (addressInfo: any) => {
    if (selectedCustomer) {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:5000/api/customers/${selectedCustomer.id}/address`, {
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
      const response = await fetch('http://localhost:5000/api/customers', {
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
      const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/customers/${selectedCustomer?.id}`, {
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

  const handleCopyWechat = (wechat: string) => {
    navigator.clipboard.writeText(wechat)
      .then(() => message.success('微信号已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };

  const showUpdateModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    updateForm.setFieldsValue(customer);
    setIsUpdateModalVisible(true);
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索姓名拼音"
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
        <span title={`拼音: ${record.pinyin}`}>{name}</span>
      ),
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      render: (wechat: string) => (
        <Space>
          <span>{wechat}</span>
          <CopyOutlined onClick={() => handleCopyWechat(wechat)} />
        </Space>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '默认地址',
      dataIndex: 'default_address',
      key: 'default_address',
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {loading ? (
            <div className="p-4 text-center">加载中...</div>
          ) : (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </div>
        
        <div>
          <AddressParser onAddressSelected={handleAddressSelected} />
        </div>
      </div>

      <Modal
        title="添加客户"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
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
            rules={[{ required: true, message: '请输入微信号' }]}
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
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
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
            rules={[{ required: true, message: '请输入微信号' }]}
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
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
