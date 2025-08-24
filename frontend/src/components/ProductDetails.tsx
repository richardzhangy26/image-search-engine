import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getProductById, ProductInfo, getImageUrl } from '../services/api';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const productData = await getProductById(id);
        setProduct(productData);
        setError(null);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err instanceof Error ? err.message : '获取商品详情失败');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">加载商品信息中...</h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">加载失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || '商品不存在'}</p>
                  {error && error.includes('CORS跨域错误') && (
                    <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                      <p className="text-xs">
                        <strong>解决方案：</strong><br/>
                        1. 检查后端是否启动在正确的端口 (5000)<br/>
                        2. 确认后端CORS配置包含当前访问地址：{window.location.origin}<br/>
                        3. 检查防火墙和网络设置
                      </p>
                    </div>
                  )}
                  {error && error.includes('网络连接失败') && (
                    <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                      <p className="text-xs">
                        <strong>解决方案：</strong><br/>
                        1. 确认后端服务已启动<br/>
                        2. 检查网络连接是否正常<br/>
                        3. 尝试直接访问后端服务
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回搜索
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回搜索
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <img
                  src={product.good_img && product.good_img[0] ? getImageUrl(product.good_img[0].url) : ''}
                  alt={product.name}
                  className="w-full rounded-lg shadow-lg"
                />
                {product.size_img && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">尺码表</h3>
                    <img
                      src={product.size_img}
                      alt="尺码表"
                      className="w-full rounded-lg shadow"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <div className="text-2xl font-bold text-red-600">
                      ¥{product.sale_price.toFixed(2)}
                    </div>
                    {product.sale_price < product.price && (
                      <div className="text-lg text-gray-500 line-through">
                        ¥{product.price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {product.product_code && (
                    <div>
                      <span className="text-gray-600">货号：</span>
                      <span className="font-medium">{product.product_code}</span>
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <p className="text-gray-600">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {product.style && (
                      <div>
                        <span className="text-gray-600">风格：</span>
                        <span className="font-medium">{product.style}</span>
                      </div>
                    )}
                    {product.color && (
                      <div>
                        <span className="text-gray-600">颜色：</span>
                        <span className="font-medium">{product.color}</span>
                      </div>
                    )}
                    {product.size && (
                      <div>
                        <span className="text-gray-600">尺码：</span>
                        <span className="font-medium">{product.size}</span>
                      </div>
                    )}
                    {product.main_material && (
                      <div>
                        <span className="text-gray-600">主面料：</span>
                        <span className="font-medium">{product.main_material}</span>
                      </div>
                    )}
                    {product.pattern && (
                      <div>
                        <span className="text-gray-600">图案：</span>
                        <span className="font-medium">{product.pattern}</span>
                      </div>
                    )}
                    {product.clothing_length && (
                      <div>
                        <span className="text-gray-600">衣长：</span>
                        <span className="font-medium">{product.clothing_length}</span>
                      </div>
                    )}
                    {product.skirt_length && (
                      <div>
                        <span className="text-gray-600">裙长：</span>
                        <span className="font-medium">{product.skirt_length}</span>
                      </div>
                    )}
                    {product.pants_length && (
                      <div>
                        <span className="text-gray-600">裤长：</span>
                        <span className="font-medium">{product.pants_length}</span>
                      </div>
                    )}
                    {product.sleeve_length && (
                      <div>
                        <span className="text-gray-600">袖长：</span>
                        <span className="font-medium">{product.sleeve_length}</span>
                      </div>
                    )}
                    {product.fashion_elements && (
                      <div>
                        <span className="text-gray-600">流行元素：</span>
                        <span className="font-medium">{product.fashion_elements}</span>
                      </div>
                    )}
                    {product.craft && (
                      <div>
                        <span className="text-gray-600">工艺：</span>
                        <span className="font-medium">{product.craft}</span>
                      </div>
                    )}
                    {product.launch_season && (
                      <div>
                        <span className="text-gray-600">上市年份/季节：</span>
                        <span className="font-medium">{product.launch_season}</span>
                      </div>
                    )}
                    {product.factory_name && (
                      <div>
                        <span className="text-gray-600">工厂名称：</span>
                        <span className="font-medium">{product.factory_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;