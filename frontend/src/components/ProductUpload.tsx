import React, { useState } from 'react';
import { uploadProduct, uploadProductCSV, ProductInfo } from '../services/api';

export const ProductUpload: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imagesFolder, setImagesFolder] = useState<string>('');
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    product_id: '',
    name: '',
    attributes: {},
    price: 0,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadProduct(productInfo, images);
      setSuccess(`商品添加成功！商品ID: ${result.product_id}`);
      // 清空表单
      setProductInfo({
        product_id: '',
        name: '',
        attributes: {},
        price: 0,
        description: '',
      });
      setImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('请选择CSV文件');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadProductCSV(csvFile, imagesFolder);
      setSuccess(`批量添加商品成功！共添加 ${result.count} 个商品`);
      setCsvFile(null);
      setImagesFolder('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量添加商品失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">添加商品</h2>
      
      {/* 单个商品添加表单 */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-xl font-semibold mb-3">单个商品添加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">商品ID</label>
            <input
              type="text"
              value={productInfo.product_id}
              onChange={(e) =>
                setProductInfo({ ...productInfo, product_id: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">商品名称</label>
            <input
              type="text"
              value={productInfo.name}
              onChange={(e) =>
                setProductInfo({ ...productInfo, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">价格</label>
            <input
              type="number"
              value={productInfo.price}
              onChange={(e) =>
                setProductInfo({ ...productInfo, price: Number(e.target.value) })
              }
              className="w-full p-2 border rounded"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={productInfo.description}
              onChange={(e) =>
                setProductInfo({ ...productInfo, description: e.target.value })
              }
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">商品图片</label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full"
              multiple
              accept="image/*"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 text-white rounded ${
              loading
                ? 'bg-gray-400'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? '添加中...' : '添加商品'}
          </button>
        </form>
      </div>

      {/* CSV批量上传表单 */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-3">CSV批量上传</h3>
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">CSV文件</label>
            <input
              type="file"
              onChange={handleCsvChange}
              className="w-full p-2 border rounded"
              accept=".csv"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              CSV文件应包含以下列：名称、货号、图案、尺寸、颜色
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">图片文件夹路径</label>
            <input
              type="text"
              value={imagesFolder}
              onChange={(e) => setImagesFolder(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="例如：/path/to/images"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              请输入包含商品图片的文件夹路径，图片名称应与CSV中的商品名称一致
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading || !csvFile}
            >
              {loading ? '处理中...' : '上传CSV并处理'}
            </button>
          </div>
        </form>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}
    </div>
  );
};
