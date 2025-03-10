import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductUpload } from './components/ProductUpload';
import { ProductSearch } from './components/ProductSearch';
import ProductDetails from './components/ProductDetails';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">商品图像搜索系统</h1>
        </div>
      </header>

      <Routes>
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/"
          element={
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`${
                        activeTab === 'search'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/2 py-4 px-1 text-center border-b-2 font-medium`}
                    >
                      搜索商品
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`${
                        activeTab === 'upload'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/2 py-4 px-1 text-center border-b-2 font-medium`}
                    >
                      添加商品
                    </button>
                  </nav>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                {activeTab === 'search' ? <ProductSearch /> : <ProductUpload />}
              </div>
            </main>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;