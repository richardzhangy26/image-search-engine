import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductUpload } from './components/ProductUpload';
import { ProductSearch } from './components/ProductSearch';
import ProductDetails from './components/ProductDetails';
import OrderManagement from './components/OrderManagement';
import CustomerManagement from './components/CustomerManagement';
import OrderCreation from './components/OrderCreation';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'orders' | 'customers'>('search');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-full mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">商品图像搜索系统</h1>
        </div>
      </header>

      <Routes>
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/"
          element={
            <div className="flex">
              {/* 左侧主内容区域 */}
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
                        } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        搜索商品
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`${
                          activeTab === 'upload'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        添加商品
                      </button>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className={`${
                          activeTab === 'orders'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        查看订单
                      </button>
                      <button
                        onClick={() => setActiveTab('customers')}
                        className={`${
                          activeTab === 'customers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
                      >
                        查看客户
                      </button>
                    </nav>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                  {activeTab === 'search' && <ProductSearch />}
                  {activeTab === 'upload' && <ProductUpload />}
                  {activeTab === 'orders' && <OrderManagement />}
                  {activeTab === 'customers' && <CustomerManagement />}
                </div>
              </main>

              {/* 右侧固定的订单创建面板 */}
              <div className="w-[500px] min-h-screen border-l border-gray-200 bg-white overflow-y-auto">
                <OrderCreation />
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;