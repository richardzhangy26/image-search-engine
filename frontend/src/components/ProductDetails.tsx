import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { getProductById, ProductDetails as ProductDetailsType, getImageUrl } from '../services/api';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailsType | null>(null);
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {error || '商品不存在'}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回搜索
          </button>
        </div>
      </div>
    );
  }

  // Convert attributes to features and specs for display
  const features = product.features || 
    Object.entries(product.attributes || {})
      .filter(([key]) => key.toLowerCase().includes('feature') || key.toLowerCase().includes('特点'))
      .map(([_, value]) => value);

  const specs = product.specs || 
    Object.entries(product.attributes || {})
      .filter(([key]) => !key.toLowerCase().includes('feature') && !key.toLowerCase().includes('特点'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回搜索
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <img
                src={getImageUrl(product.image_path)}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.src = '/placeholder-image.png';
                  imgElement.alt = 'Image not available';
                }}
              />
              <div className="grid grid-cols-4 gap-2">
                {/* Additional product images would go here */}
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-lg text-gray-500">
                  {product.attributes?.category || product.attributes?.类别 || '未分类'}
                </p>
              </div>

              <div className="text-4xl font-bold text-gray-900">
                ¥{product.price.toFixed(2)}
              </div>

              <p className="text-gray-600">{product.description}</p>

              {features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">产品特点</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys(specs).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">规格参数</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center hover:bg-blue-700 transition-colors">
                <ShoppingCart className="w-5 h-5 mr-2" />
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;