import React, { useState, useEffect } from 'react';
import { searchProducts, SearchResult, getImageUrl } from '../services/api';

export const ProductSearch: React.FC = () => {
  const [searchImage, setSearchImage] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSearchImage(file);
      setPreviewUrl(URL.createObjectURL(file));
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
          <input
            type="file"
            onChange={handleImageChange}
            className="w-full"
            accept="image/*"
            required
          />
        </div>

        {previewUrl && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt="Search preview"
              className="max-w-xs rounded shadow"
            />
          </div>
        )}

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
              <div
                key={result.product_id}
                className="border rounded-lg overflow-hidden shadow-sm"
              >
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
