import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { ProductUpload } from './components/ProductUpload';
import { ProductSearch } from './components/ProductSearch';
import ProductDetails from './components/ProductDetails';
import OrderManagement from './components/OrderManagement';
import CustomerManagement from './components/CustomerManagement';
import OrderCreation from './components/OrderCreation';
import AIVirtualTryOn from './components/AIVirtualTryOn';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'orders' | 'customers' | 'virtualTryOn'>('search');
  const [isOrderCreationVisible, setIsOrderCreationVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const handleOrderCreate = async (orderData: any) => {
    // 关闭弹窗并重置编辑状态
    setIsOrderCreationVisible(false);
    setEditingOrder(null);
    // 如果当前在订单页面，可以刷新订单列表
    if (activeTab === 'orders') {
      window.location.reload(); // 简单的刷新方式
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsOrderCreationVisible(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-full mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">商品图像搜索系统</h1>
          <Button
            type="primary"
            onClick={() => setIsOrderCreationVisible(!isOrderCreationVisible)}
            icon={<PlusOutlined />}
            style={{ marginLeft: '16px' }}
          >
            {isOrderCreationVisible ? '收起订单' : '创建订单'}
            <DownOutlined style={{ transform: isOrderCreationVisible ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
          </Button>
        </div>
      </header>

      {/* 订单创建下拉区域 */}
      {isOrderCreationVisible && (
        <div className="bg-white shadow-lg border-b">
          <div className="max-w-full mx-auto px-4 py-4">
            <OrderCreation onOrderCreate={handleOrderCreate} editingOrder={editingOrder} />
          </div>
        </div>
      )}

      <Routes>
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/"
          element={
            <div className="flex">
              {/* 主内容区域 */}
              <main className="flex-1 py-6 px-6">
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                      <button
                        onClick={() => setActiveTab('search')}
                        className={`${
                          activeTab === 'search'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/5 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        搜索商品
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`${
                          activeTab === 'upload'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/5 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        添加商品
                      </button>
                      <button
                        onClick={() => setActiveTab('virtualTryOn')}
                        className={`${
                          activeTab === 'virtualTryOn'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/5 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        AI试衣
                      </button>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className={`${
                          activeTab === 'orders'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/5 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        查看订单
                      </button>
                      <button
                        onClick={() => setActiveTab('customers')}
                        className={`${
                          activeTab === 'customers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/5 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        查看客户
                      </button>
                    </nav>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                  {activeTab === 'search' && <ProductSearch />}
                  {activeTab === 'upload' && <ProductUpload />}
                  {activeTab === 'virtualTryOn' && <AIVirtualTryOn />}
                  {activeTab === 'orders' && <OrderManagement />}
                  {activeTab === 'customers' && <CustomerManagement />}
                </div>
              </main>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default App;