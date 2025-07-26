import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchProducts, SearchResult, getImageUrl, getProductById, API_BASE_URL, ProductInfo } from '../services/api';
import { Input, Card, Image, Descriptions, message } from 'antd';

export const ProductSearch: React.FC = () => {
  const [searchImage, setSearchImage] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Debug: 监控 searchImage 状态变化
  useEffect(() => {
    console.log('🔍 searchImage 状态变化:', {
      hasImage: !!searchImage,
      fileName: searchImage?.name,
      fileSize: searchImage?.size,
      fileType: searchImage?.type,
      timestamp: new Date().toISOString()
    });
  }, [searchImage]);

  // 统一的图片处理函数
  const handleImageFile = useCallback((file: File, source: string) => {
    console.log(`📸 处理图片文件 [${source}]:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    // 清理旧的预览URL
    if (previewUrl) {
      console.log(`📸 [${source}] 清理旧的预览URL`);
      URL.revokeObjectURL(previewUrl);
    }

    // 创建新的预览URL
    const newPreviewUrl = URL.createObjectURL(file);
    console.log(`📸 [${source}] 创建新的预览URL:`, newPreviewUrl);

    // 同时设置两个状态
    setSearchImage(file);
    setPreviewUrl(newPreviewUrl);
    
    // 强制重新渲染
    setForceUpdate(prev => prev + 1);
    
    console.log(`📸 [${source}] 图片处理完成`);
  }, [previewUrl]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Add paste event listener to the document
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      console.log('📋 粘贴事件触发');
      console.log('📋 剪贴板数据:', e.clipboardData);
      console.log('📋 文件数量:', e.clipboardData?.files.length || 0);
      
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        console.log('📋 检测到文件:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        if (file.type.startsWith('image/')) {
          console.log('📋 确认是图片文件，开始处理');
          e.preventDefault();
          handleImageFile(file, '粘贴');
        } else {
          console.log('📋 不是图片文件，忽略');
        }
      } else {
        console.log('📋 剪贴板中没有文件');
      }
    };

    console.log('📋 添加粘贴事件监听器');
    document.addEventListener('paste', handlePaste);
    return () => {
      console.log('📋 移除粘贴事件监听器');
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleImageFile]);

  const handleFileSelected = useCallback((file: File) => {
    handleImageFile(file, '文件选择');
  }, [handleImageFile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file, '拖拽');
      }
    }
  }, [handleImageFile]);

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('搜索按钮被点击');
    console.log('搜索图片状态:', searchImage ? '已选择' : '未选择');
    
    if (!searchImage) {
      console.log('未选择图片，搜索终止');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('开始搜索，图片大小:', searchImage.size, '字节');
    
    try {
      console.log('发送搜索请求到:', `${API_BASE_URL}/api/products/search`);
      const searchRes = await searchProducts(searchImage);
      console.log('搜索结果:', searchRes);
      setResults(searchRes);
    } catch (err) {
      console.error('搜索错误:', err); 
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
      console.log('搜索完成');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, result: SearchResult) => {
    console.error(`Error loading image for product ${result.id}`, e);
    console.log('Image path that failed:', result.image_path);
    console.log('Original path:', result.original_path);
    
    // Try alternative paths
    const imgElement = e.target as HTMLImageElement;
    
    // If the current path includes 商品信息/商品图, try a different format
    if (result.image_path && result.image_path.includes('商品信息/商品图')) {
      console.log('Trying alternative path for product image');
      
      // Extract the filename from the path
      const pathParts = result.original_path?.split('/') || [];
      const filename = pathParts[pathParts.length - 1];
      
      if (filename) {
        // Try direct images path
        const altPath = `/api/images/${filename}`;
        console.log('Trying alternative path:', altPath);
        imgElement.src = altPath;
        return;
      }
    }
    
    // If we get here, set to a placeholder
    imgElement.src = '/placeholder-image.png';
    imgElement.alt = 'Image not available';
    imgElement.className = `${imgElement.className} image-error`;
  };

  const handleIdSearch = async (productId: string) => {
    if (!productId.trim()) {
      message.warning('请输入商品ID');
      return;
    }

    setLoading(true);
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '搜索失败');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">搜索商品</h2>
      
      <div className="mb-4">
        <Input.Search
          placeholder="请输入商品ID"
          enterButton="搜索"
          size="large"
          loading={loading}
          onSearch={handleIdSearch}
        />
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">上传图片搜索</label>
          
          <div 
            ref={dropAreaRef}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Search preview"
                  className="max-h-48 rounded shadow mb-2"
                />
                <p className="text-sm text-gray-500">点击更换图片</p>
              </div>
            ) : (
              <div className="py-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  点击选择图片或拖拽图片到此处
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  支持 PNG, JPG, JPEG, GIF 格式
                </p>
                <p className="mt-1 text-xs text-blue-500">
                  也可以使用 Cmd+V/Ctrl+V直接粘贴图片
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">操作失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('CORS跨域错误') && (
                    <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                      <p className="text-xs">
                        <strong>解决方案：</strong><br/>
                        1. 检查后端是否启动在正确的端口 (5000)<br/>
                        2. 确认后端CORS配置包含当前访问地址：{window.location.origin}<br/>
                        3. 检查防火墙和网络设置
                      </p>
                    </div>
                  )}
                  {error.includes('网络连接失败') && (
                    <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                      <p className="text-xs">
                        <strong>解决方案：</strong><br/>
                        1. 确认后端服务已启动<br/>
                        2. 检查网络连接是否正常<br/>
                        3. 尝试直接访问：<a href={API_BASE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{API_BASE_URL}</a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !searchImage}
          className={`w-full p-2 text-white rounded ${
            loading || !searchImage
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          onClick={() => {
            console.log('🔘 搜索按钮点击事件:', {
              loading,
              hasSearchImage: !!searchImage,
              searchImageName: searchImage?.name,
              disabled: loading || !searchImage,
              forceUpdateCounter: forceUpdate,
              timestamp: new Date().toISOString()
            });
          }}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {results && results.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">搜索结果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <div 
                key={result.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => window.open(`/product/${result.id}`, '_blank')}
              >
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <img
                    src={getImageUrl(result.image_path)}
                    alt={result.image_path ? `缩略图 ${result.id}` : '缩略图'}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {/* 信息部分 */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-1">
                    产品ID: {result.id}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    相似度: {(result.similarity * 100).toFixed(2)}%
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {typeof result.price === 'number' ? `¥${result.price.toFixed(2)}` : '价格未知'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    {/* 小缩略图 */}
                    {(result.image_path) && (
                      <img
                        src={getImageUrl(result.image_path)}
                        alt={result.image_path ? `缩略图 ${result.id}` : '缩略图'}
                        className="w-8 h-8 object-cover rounded mr-2 border border-gray-200"
                      />
                    )}

                    <span className="text-sm text-blue-600 font-medium">查看详情 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {product && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-bold mb-4">商品图片</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.good_img && (() => {
                  const raw = Array.isArray(product.good_img)
                    ? (product.good_img as (string | { url: string })[])
                    : (product.good_img ? JSON.parse(product.good_img as string) : []);
                  return (raw as (string | { url: string })[]).map((img: string | { url: string }, index: number) => {
                    const path = typeof img === 'string' ? img : img.url;
                    return (
                      <Image
                        key={index}
                        src={`${API_BASE_URL}${path}`}
                        alt={`商品图片 ${index + 1}`}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    );
                  });
                })()}
              </div>
              {product.size_img && (
                <>
                  <h3 className="text-xl font-bold my-4">尺码图片</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const sizeRaw = Array.isArray(product.size_img)
                        ? (product.size_img as (string | { url: string })[])
                        : (product.size_img ? JSON.parse(product.size_img as string) : []);
                      return (sizeRaw as (string | { url: string })[]).map((img: string | { url: string }, index: number) => {
                        const path = typeof img === 'string' ? img : img.url;
                        return (
                          <Image
                            key={index}
                            src={`${API_BASE_URL}${path}`}
                            alt={`尺码图片 ${index + 1}`}
                            style={{ width: '100%', height: 'auto' }}
                          />
                        );
                      });
                    })()}
                  </div>
                </>
              )}
            </div>
            
            <div>
              <Descriptions title="商品信息" bordered column={1}>
                <Descriptions.Item label="商品ID">{product.id}</Descriptions.Item>
                <Descriptions.Item label="商品名称">{product.name}</Descriptions.Item>
                <Descriptions.Item label="成本价">¥{product.price}</Descriptions.Item>
                <Descriptions.Item label="销售价">¥{product.sale_price}</Descriptions.Item>
                <Descriptions.Item label="货号">{product.product_code}</Descriptions.Item>
                <Descriptions.Item label="图案">{product.pattern}</Descriptions.Item>
                <Descriptions.Item label="裙长">{product.skirt_length}</Descriptions.Item>
                <Descriptions.Item label="衣长">{product.clothing_length}</Descriptions.Item>
                <Descriptions.Item label="风格">{product.style}</Descriptions.Item>
                <Descriptions.Item label="裤长">{product.pants_length}</Descriptions.Item>
                <Descriptions.Item label="袖长">{product.sleeve_length}</Descriptions.Item>
                <Descriptions.Item label="流行元素">{product.fashion_elements}</Descriptions.Item>
                <Descriptions.Item label="工艺">{product.craft}</Descriptions.Item>
                <Descriptions.Item label="上市年份/季节">{product.launch_season}</Descriptions.Item>
                <Descriptions.Item label="主面料成分">{product.main_material}</Descriptions.Item>
                <Descriptions.Item label="颜色">{product.color}</Descriptions.Item>
                <Descriptions.Item label="尺码">{product.size}</Descriptions.Item>
                <Descriptions.Item label="工厂名称">{product.factory_name}</Descriptions.Item>
                <Descriptions.Item label="描述">{product.description}</Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductSearch;
