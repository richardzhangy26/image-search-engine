import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchProducts, SearchResult, getImageUrl } from '../services/api';

export const ProductSearch: React.FC = () => {
  const [searchImage, setSearchImage] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

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
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleFileSelected(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileSelected = (file: File) => {
    setSearchImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelected(file);
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchImage) return;

    setLoading(true);
    setError(null);
    try {
      const { results } = await searchProducts(searchImage);
      console.log('Search results:', results); // 添加调试日志
      setResults(results);
    } catch (err) {
      console.error('Search error:', err); // 添加调试日志
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, result: SearchResult) => {
    console.error(`Error loading image for product ${result.product_id}`, e);
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">搜索商品</h2>
      
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
              required
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
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !searchImage}
          className={`w-full p-2 text-white rounded ${
            loading || !searchImage
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">搜索结果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Link 
                to={`/product/${result.product_id}`} 
                key={result.product_id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="cursor-pointer">
                  <img
                    src={getImageUrl(result.image_path)}
                    alt={result.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => handleImageError(e, result)}
                  />
                  <div className="p-4">
                    <h4 className="font-semibold">{result.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      相似度: {(result.similarity * 100).toFixed(2)}%
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      ¥{result.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {result.description}
                    </p>
                    {Object.entries(result.attributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-600 mr-2 mt-2"
                      >
                        {key}: {value}
                      </span>
                    ))}
                    <div className="mt-3 text-sm text-blue-600 font-medium">
                      查看详情 →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
