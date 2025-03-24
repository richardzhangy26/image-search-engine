import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  customer_name: string;
  customer_id: string;
  products: {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Mock data for demonstration
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setOrders([
          {
            id: 'ORD-001',
            customer_name: '张三',
            customer_id: 'CUST-001',
            products: [
              { product_id: 'PROD-001', name: '时尚女装', quantity: 2, price: 199.99 },
              { product_id: 'PROD-002', name: '休闲裤', quantity: 1, price: 99.99 }
            ],
            total_amount: 499.97,
            status: 'delivered',
            created_at: '2025-02-15T08:30:00Z',
            updated_at: '2025-02-18T14:20:00Z'
          },
          {
            id: 'ORD-002',
            customer_name: '李四',
            customer_id: 'CUST-002',
            products: [
              { product_id: 'PROD-003', name: '运动鞋', quantity: 1, price: 299.99 }
            ],
            total_amount: 299.99,
            status: 'processing',
            created_at: '2025-03-05T10:15:00Z',
            updated_at: '2025-03-06T09:45:00Z'
          }
        ]);
      } catch (err) {
        setError('加载订单数据失败');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const handleAddOrder = () => {
    setIsAdding(true);
    setSelectedOrder({
      id: `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customer_name: '',
      customer_id: '',
      products: [],
      total_amount: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditing(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('确定要删除此订单吗？')) {
      try {
        setLoading(true);
        setError(null);
        // In a real app, this would be an API call
        // Simulate API delay
        setTimeout(() => {
          setOrders(orders.filter(order => order.id !== orderId));
          setLoading(false);
        }, 300);
      } catch (err) {
        setError('删除订单失败');
        setLoading(false);
      }
    }
  };

  const handleSaveOrder = (updatedOrder: Order) => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, this would be an API call
      // Simulate API delay
      setTimeout(() => {
        if (isAdding) {
          setOrders([...orders, updatedOrder]);
          setIsAdding(false);
        } else {
          setOrders(orders.map(order => order.id === updatedOrder.id ? updatedOrder : order));
          setIsEditing(false);
        }
        setSelectedOrder(null);
        setLoading(false);
      }, 300);
    } catch (err) {
      setError(isAdding ? '添加订单失败' : '更新订单失败');
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAdding(false);
    setSelectedOrder(null);
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">订单管理</h2>
        <button
          onClick={handleAddOrder}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加订单
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {(isEditing || isAdding) && selectedOrder ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {isAdding ? '添加新订单' : '编辑订单'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">订单编号</label>
              <input
                type="text"
                value={selectedOrder.id}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">客户姓名</label>
              <input
                type="text"
                value={selectedOrder.customer_name}
                onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">客户ID</label>
              <input
                type="text"
                value={selectedOrder.customer_id}
                onChange={(e) => setSelectedOrder({...selectedOrder, customer_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">订单状态</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value as Order['status']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="shipped">已发货</option>
                <option value="delivered">已送达</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">总金额</label>
              <input
                type="number"
                value={selectedOrder.total_amount}
                onChange={(e) => setSelectedOrder({...selectedOrder, total_amount: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <h4 className="font-medium mb-2">商品列表</h4>
          {selectedOrder.products.map((product, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="商品名称"
                  value={product.name}
                  onChange={(e) => {
                    const updatedProducts = [...selectedOrder.products];
                    updatedProducts[index].name = e.target.value;
                    setSelectedOrder({...selectedOrder, products: updatedProducts});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="商品ID"
                  value={product.product_id}
                  onChange={(e) => {
                    const updatedProducts = [...selectedOrder.products];
                    updatedProducts[index].product_id = e.target.value;
                    setSelectedOrder({...selectedOrder, products: updatedProducts});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="数量"
                  value={product.quantity}
                  onChange={(e) => {
                    const updatedProducts = [...selectedOrder.products];
                    updatedProducts[index].quantity = parseInt(e.target.value);
                    setSelectedOrder({...selectedOrder, products: updatedProducts});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="单价"
                  value={product.price}
                  onChange={(e) => {
                    const updatedProducts = [...selectedOrder.products];
                    updatedProducts[index].price = parseFloat(e.target.value);
                    setSelectedOrder({...selectedOrder, products: updatedProducts});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => {
                    const updatedProducts = selectedOrder.products.filter((_, i) => i !== index);
                    setSelectedOrder({...selectedOrder, products: updatedProducts});
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => {
              const updatedProducts = [...selectedOrder.products, {
                product_id: '',
                name: '',
                quantity: 1,
                price: 0
              }];
              setSelectedOrder({...selectedOrder, products: updatedProducts});
            }}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-4"
          >
            + 添加商品
          </button>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={() => handleSaveOrder(selectedOrder)}
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
          ) : orders.length === 0 ? (
            <div className="p-4 text-center text-gray-500">暂无订单数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      订单编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      订单金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">ID: {order.customer_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">¥{order.total_amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{order.products.length} 件商品</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {order.status === 'pending' && '待处理'}
                          {order.status === 'processing' && '处理中'}
                          {order.status === 'shipped' && '已发货'}
                          {order.status === 'delivered' && '已送达'}
                          {order.status === 'cancelled' && '已取消'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditOrder(order)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
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

export default OrderManagement;
