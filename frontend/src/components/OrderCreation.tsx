import React, { useState } from 'react';
import { Input, Button, Select, message, Modal, Image, Form } from 'antd';
import { getProductById, getImageUrl, API_BASE_URL } from '../services/api';

interface ProductInfo {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  description: string;
  image?: string;
  good_img?: string;
  color?: string;
  size?: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
  default_address?: string;
}

interface OrderCreationProps {
  onOrderCreate?: (order: any) => void;
}

const OrderCreation: React.FC<OrderCreationProps> = ({ onOrderCreate }) => {
  // 状态管理
  const [tempCustomerId, setTempCustomerId] = useState('');
  const [tempProductId, setTempProductId] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<CustomerInfo | null>(null);
  const [currentProduct, setCurrentProduct] = useState<ProductInfo>({
    id: '',
    name: '',
    price: 0,
    description: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form] = Form.useForm();

  // 错误提示
  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalVisible(true);
  };

  const handleErrorModalOk = () => {
    setIsErrorModalVisible(false);
    setErrorMessage('');
  };

  // 处理客户ID查询
  const handleCustomerIdComplete = async () => {
    if (!tempCustomerId.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${tempCustomerId.trim()}`);
      if (!response.ok) {
        showError('未找到客户');
        return;
      }
      const customer = await response.json();
      setCurrentCustomer(customer);
    } catch (error) {
      showError('查询客户信息失败');
    }
  };

  // 处理商品ID查询
  const handleProductIdComplete = async () => {
    if (!tempProductId.trim()) return;
    try {
      const product = await getProductById(tempProductId.trim());
      if (product) {
        const images = Array.isArray(product.good_img) 
          ? product.good_img 
          : (product.good_img ? JSON.parse(product.good_img) : []);
        const thumbnailUrl = images.length > 0 ? getImageUrl(images[0]) : '';

        setCurrentProduct({
          ...product,
          image: thumbnailUrl
        });
      } else {
        showError('未找到商品');
      }
    } catch (error) {
      showError('获取商品信息失败');
    }
  };

  // 解析选项（颜色、尺码）
  const parseOptions = (str?: string): string[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return str.split(/[,，]/).map(item => item.trim()).filter(Boolean);
    } catch {
      return str.split(/[,，]/).map(item => item.trim()).filter(Boolean);
    }
  };

  // 添加商品到订单
  const handleAddProduct = () => {
    if (!currentProduct.id) {
      showError('请先选择商品');
      return;
    }
    
    if (selectedProducts.some(p => p.product_id === currentProduct.id)) {
      showError('该商品已添加到订单中');
      return;
    }

    const newProduct = {
      product_id: currentProduct.id,
      name: currentProduct.name,
      quantity: 1,
      price: currentProduct.sale_price || currentProduct.price,
      color: currentProduct.color || '',
      size: currentProduct.size || '',
      image: currentProduct.image,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setCurrentProduct({
      id: '',
      name: '',
      price: 0,
      description: '',
    });
    setTempProductId('');
  };

  // 更新商品数量
  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedProducts = selectedProducts.map((p, i) =>
      i === index ? { ...p, quantity } : p
    );
    setSelectedProducts(updatedProducts);
  };

  // 更新商品颜色
  const handleColorChange = (index: number, color: string) => {
    const updatedProducts = selectedProducts.map((p, i) =>
      i === index ? { ...p, color } : p
    );
    setSelectedProducts(updatedProducts);
  };

  // 更新商品尺码
  const handleSizeChange = (index: number, size: string) => {
    const updatedProducts = selectedProducts.map((p, i) =>
      i === index ? { ...p, size } : p
    );
    setSelectedProducts(updatedProducts);
  };

  // 移除商品
  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  // 创建订单
  const handleCreateOrder = async () => {
    if (!currentCustomer) {
      showError('请先选择客户');
      return;
    }
    if (selectedProducts.length === 0) {
      showError('请添加至少一个商品');
      return;
    }

    try {
      const formValues = form.getFieldsValue();
      const orderData = {
        customer_id: currentCustomer.id,
        shipping_address: currentCustomer.default_address || currentCustomer.address,
        products: selectedProducts.map(p => ({
          product_id: p.product_id,
          quantity: p.quantity,
          price: p.price,
          size: p.size || '',
          color: p.color || '',
          product_name: p.name,
          product_code: p.product_code
        })),
        total_amount: selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
        customer_notes: formValues.customer_notes || '',
        internal_notes: formValues.internal_notes || ''
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '创建订单失败');
      }

      const result = await response.json();
      message.success('订单创建成功');
      
      // 重置表单
      form.resetFields();
      setCurrentCustomer(null);
      setSelectedProducts([]);
      setTempCustomerId('');
      setTempProductId('');
      
      // 触发父组件回调
      onOrderCreate && onOrderCreate(result);
    } catch (error) {
      console.error('创建订单时出错:', error);
      message.error(error instanceof Error ? error.message : '创建订单失败');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">添加新订单</h2>
      
      {/* 客户和商品ID输入区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">客户ID</label>
          <div className="flex gap-2">
            <Input
              value={tempCustomerId}
              onChange={(e) => setTempCustomerId(e.target.value)}
              placeholder="输入客户ID"
              className="flex-1"
              onPressEnter={handleCustomerIdComplete}
            />
            <Button onClick={handleCustomerIdComplete}>查找</Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">商品ID</label>
          <div className="flex gap-2">
            <Input
              value={tempProductId}
              onChange={(e) => setTempProductId(e.target.value)}
              placeholder="输入商品ID"
              className="flex-1"
              onPressEnter={handleProductIdComplete}
            />
            <Button onClick={handleProductIdComplete}>展示</Button>
            <Button type="primary" onClick={handleAddProduct} disabled={!currentProduct.id}>添加</Button>
          </div>
        </div>
      </div>

      {/* 客户信息显示区域 */}
      {currentCustomer && (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-medium mb-2">客户信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">姓名: {currentCustomer.name}</p>
              <p className="text-sm text-gray-600">电话: {currentCustomer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">地址: {currentCustomer.default_address || currentCustomer.address}</p>
              <p className="text-sm text-gray-600">ID: {currentCustomer.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* 当前商品信息显示区域 */}
      {currentProduct.id && (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-medium mb-2">商品信息</h3>
          <div className="flex gap-4">
            {currentProduct.image && (
              <div className="w-24 h-24">
                <Image
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  width={100}
                  height={100}
                  className="object-cover rounded"
                  preview={false}
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="text"
                className="w-full border rounded-md px-2 py-1 mb-2"
                value={currentProduct.name}
                readOnly
                placeholder="商品名称"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">价格:</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-2 py-1"
                    value={currentProduct.sale_price || currentProduct.price}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">数量:</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border rounded-md px-2 py-1"
                    value={1}
                    readOnly
                  />
                </div>
                {currentProduct.color && (
                  <div>
                    <label className="text-sm text-gray-600">颜色:</label>
                    <Select
                      className="w-full"
                      value={currentProduct.color}
                    >
                      {parseOptions(currentProduct.color).map((color) => (
                        <Select.Option key={color} value={color}>{color}</Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
                {currentProduct.size && (
                  <div>
                    <label className="text-sm text-gray-600">尺码:</label>
                    <Select
                      className="w-full"
                      value={currentProduct.size}
                    >
                      {parseOptions(currentProduct.size).map((size) => (
                        <Select.Option key={size} value={size}>{size}</Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">ID: {currentProduct.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* 已选商品列表 */}
      {selectedProducts.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">已添加商品</h3>
          <div className="space-y-4">
            {selectedProducts.map((product, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded flex gap-4">
                {product.image && (
                  <div className="w-24 h-24">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="object-cover rounded"
                      preview={false}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full border rounded-md px-2 py-1 mb-2"
                    value={product.name}
                    readOnly
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-gray-600">价格:</label>
                      <input
                        type="number"
                        className="w-full border rounded-md px-2 py-1"
                        value={product.price}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          const updatedProducts = selectedProducts.map((p, i) =>
                            i === index ? { ...p, price: newPrice } : p
                          );
                          setSelectedProducts(updatedProducts);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">数量:</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded-md px-2 py-1"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      />
                    </div>
                    {product.color && (
                      <div>
                        <label className="text-sm text-gray-600">颜色:</label>
                        <Select
                          className="w-full"
                          value={product.color}
                          onChange={(value) => handleColorChange(index, value)}
                        >
                          {parseOptions(product.color).map((color) => (
                            <Select.Option key={color} value={color}>{color}</Select.Option>
                          ))}
                        </Select>
                      </div>
                    )}
                    {product.size && (
                      <div>
                        <label className="text-sm text-gray-600">尺码:</label>
                        <Select
                          className="w-full"
                          value={product.size}
                          onChange={(value) => handleSizeChange(index, value)}
                        >
                          {parseOptions(product.size).map((size) => (
                            <Select.Option key={size} value={size}>{size}</Select.Option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">ID: {product.product_id}</p>
                </div>
                <Button danger onClick={() => handleRemoveProduct(index)}>
                  删除
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-right">
            <p className="text-lg font-medium">
              总金额: ¥{selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* 订单表单 */}
      <Form
        form={form}
        onFinish={handleCreateOrder}
        layout="vertical"
        initialValues={{
          customer_id: currentCustomer?.id,
          shipping_address: currentCustomer?.default_address || currentCustomer?.address,
          products: selectedProducts,
          total_amount: selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)
        }}
      >
        <Form.Item name="customer_notes" label="客户备注">
          <Input.TextArea rows={2} placeholder="输入客户备注信息" />
        </Form.Item>

        <Form.Item name="internal_notes" label="内部备注">
          <Input.TextArea rows={2} placeholder="输入内部备注信息" />
        </Form.Item>

        <Form.Item className="mb-0 text-right">
          <Button
            type="primary"
            htmlType="submit"
            disabled={!currentCustomer || selectedProducts.length === 0}
          >
            创建订单
          </Button>
        </Form.Item>
      </Form>

      {/* 错误提示弹窗 */}
      <Modal
        title="错误"
        open={isErrorModalVisible}
        onOk={() => setIsErrorModalVisible(false)}
        onCancel={() => setIsErrorModalVisible(false)}
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default OrderCreation;
