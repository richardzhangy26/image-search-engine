import React, { useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for demonstration
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCustomers([
          {
            id: 'CUST-001',
            name: '张三',
            phone: '13800138000',
            email: 'zhangsan@example.com',
            address: '北京市朝阳区某某街道123号',
            notes: '重要客户，喜欢时尚类商品',
            created_at: '2024-12-10T08:30:00Z',
            total_orders: 5,
            total_spent: 2499.85
          },
          {
            id: 'CUST-002',
            name: '李四',
            phone: '13900139000',
            email: 'lisi@example.com',
            address: '上海市浦东新区某某路456号',
            notes: '新客户，对运动鞋感兴趣',
            created_at: '2025-02-15T14:20:00Z',
            total_orders: 1,
            total_spent: 299.99
          }
        ]);
      } catch (err) {
        setError('加载客户数据失败');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    setIsAdding(true);
    setSelectedCustomer({
      id: `CUST-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      created_at: new Date().toISOString(),
      total_orders: 0,
      total_spent: 0
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('确定要删除此客户吗？')) {
      try {
        setLoading(true);
        setError(null);
        // In a real app, this would be an API call
        // Simulate API delay
        setTimeout(() => {
          setCustomers(customers.filter(customer => customer.id !== customerId));
          setLoading(false);
        }, 300);
      } catch (err) {
        setError('删除客户失败');
        setLoading(false);
      }
    }
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, this would be an API call
      // Simulate API delay
      setTimeout(() => {
        if (isAdding) {
          setCustomers([...customers, updatedCustomer]);
          setIsAdding(false);
        } else {
          setCustomers(customers.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer));
          setIsEditing(false);
        }
        setSelectedCustomer(null);
        setLoading(false);
      }, 300);
    } catch (err) {
      setError(isAdding ? '添加客户失败' : '更新客户信息失败');
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAdding(false);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">客户管理</h2>
        <button
          onClick={handleAddCustomer}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加客户
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!(isEditing || isAdding) && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索客户（姓名、电话或邮箱）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {(isEditing || isAdding) && selectedCustomer ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {isAdding ? '添加新客户' : '编辑客户信息'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">客户ID</label>
              <input
                type="text"
                value={selectedCustomer.id}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">姓名</label>
              <input
                type="text"
                value={selectedCustomer.name}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">电话</label>
              <input
                type="text"
                value={selectedCustomer.phone}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input
                type="email"
                value={selectedCustomer.email}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">地址</label>
              <input
                type="text"
                value={selectedCustomer.address}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">备注</label>
              <textarea
                value={selectedCustomer.notes}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={() => handleSaveCustomer(selectedCustomer)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {loading ? (
            <div className="p-4 text-center">加载中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? '没有找到匹配的客户' : '暂无客户数据'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      联系方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      订单情况
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{customer.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.total_orders} 个订单</div>
                        <div className="text-sm text-gray-900">¥{customer.total_spent.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
