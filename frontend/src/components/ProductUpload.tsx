import React, { useState, useRef } from 'react';
import { uploadProduct, uploadProductCSV, ProductInfo } from '../services/api';
import { Upload, FileUp, Image as ImageIcon, FilePlus, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);
  const [csvDragging, setCsvDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const handleDragOver = (e: React.DragEvent, type: 'image' | 'csv') => {
    e.preventDefault();
    if (type === 'image') {
      setIsDragging(true);
    } else {
      setCsvDragging(true);
    }
  };

  const handleDragLeave = (type: 'image' | 'csv') => {
    if (type === 'image') {
      setIsDragging(false);
    } else {
      setCsvDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'csv') => {
    e.preventDefault();
    if (type === 'image') {
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        );
        if (validFiles.length > 0) {
          setImages(validFiles);
        }
      }
    } else {
      setCsvDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.csv')) {
          setCsvFile(file);
        }
      }
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
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">添加商品</h2>
      
      {/* 单个商品添加表单 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 transition-all hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
          <FilePlus className="mr-2 text-blue-500" size={20} />
          单个商品添加
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">商品ID</label>
            <input
              type="text"
              value={productInfo.product_id}
              onChange={(e) =>
                setProductInfo({ ...productInfo, product_id: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">商品名称</label>
            <input
              type="text"
              value={productInfo.name}
              onChange={(e) =>
                setProductInfo({ ...productInfo, name: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">价格</label>
            <input
              type="number"
              value={productInfo.price}
              onChange={(e) =>
                setProductInfo({ ...productInfo, price: Number(e.target.value) })
              }
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">描述</label>
            <textarea
              value={productInfo.description}
              onChange={(e) =>
                setProductInfo({ ...productInfo, description: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">商品图片</label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
              onDragOver={(e) => handleDragOver(e, 'image')}
              onDragLeave={() => handleDragLeave('image')}
              onDrop={(e) => handleDrop(e, 'image')}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>上传图片</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleImageChange}
                      className="sr-only"
                      multiple
                      accept="image/*"
                      required
                    />
                  </label>
                  <p className="pl-1">或拖拽图片到此处</p>
                </div>
                <p className="text-xs text-gray-500">
                  支持PNG, JPG, GIF等格式
                </p>
                {images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 flex items-center justify-center">
                      <CheckCircle className="mr-1" size={16} />
                      已选择 {images.length} 张图片
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2.5 text-white rounded-md transition-colors flex items-center justify-center
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
          >
            {loading ? (
              <>处理中...</>
            ) : (
              <>
                <Upload className="mr-2" size={18} />
                添加商品
              </>
            )}
          </button>
        </form>
      </div>

      {/* CSV批量上传表单 */}
      <div className="bg-white p-6 rounded-lg shadow-md transition-all hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
          <FileUp className="mr-2 text-blue-500" size={20} />
          CSV批量上传
        </h3>
        <form onSubmit={handleCsvSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">CSV文件</label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all cursor-pointer
                ${csvDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
              onDragOver={(e) => handleDragOver(e, 'csv')}
              onDragLeave={() => handleDragLeave('csv')}
              onDrop={(e) => handleDrop(e, 'csv')}
              onClick={() => csvInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>上传CSV文件</span>
                    <input
                      ref={csvInputRef}
                      type="file"
                      onChange={handleCsvChange}
                      className="sr-only"
                      accept=".csv"
                      required
                    />
                  </label>
                  <p className="pl-1">或拖拽文件到此处</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV文件应包含以下列：名称、货号、图案、尺寸、颜色
                </p>
                {csvFile && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 flex items-center justify-center">
                      <CheckCircle className="mr-1" size={16} />
                      已选择: {csvFile.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">图片文件夹路径</label>
            <input
              type="text"
              value={imagesFolder}
              onChange={(e) => setImagesFolder(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full bg-blue-600 text-white p-2.5 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
              disabled={loading || !csvFile}
            >
              {loading ? '处理中...' : (
                <>
                  <Upload className="mr-2" size={18} />
                  上传CSV并处理
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="mr-2" size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircle className="mr-2" size={18} />
          {success}
        </div>
      )}
    </div>
  );
};
