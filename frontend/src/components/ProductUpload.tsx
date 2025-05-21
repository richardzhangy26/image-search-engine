import React, { useState, useRef, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Upload, Image, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import { uploadProductCSV, ProductInfo, getProducts, addProduct, updateProduct, deleteProduct, deleteProductImage, API_BASE_URL } from '../services/api';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

export const ProductUpload: React.FC = () => {
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [form] = Form.useForm();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imagesFolder, setImagesFolder] = useState<string>('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredInfo, setFilteredInfo] = useState<Record<string, string[] | null>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      message.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const formData = new FormData();

        // good_img 处理
        const goodImgFiles = (values.good_img || []).map((file: UploadFile) => {
          if (file.originFileObj) {
            return file.originFileObj; // 新上传
          }
          if (file.response) {
            return file.response; // 已有图片的路径
          }
          return null;
        }).filter(Boolean);

        // size_img 同理处理
        const sizeImgFiles = values.size_img?.map((file: UploadFile) => file.originFileObj) || [];
        
        // 删除values中的文件列表，因为我们会单独处理
        const { size_img, good_img, ...productData } = values;
        
        formData.append('product', JSON.stringify(productData));
        // 添加图片文件或路径
        goodImgFiles.forEach((file: File | string) => {
          if (typeof file === 'string') {
            formData.append('good_images_exist', file); // 你后端需要支持这个字段
          } else {
            formData.append('good_images', file);
          }
        });

        if (editingProduct) {
          await updateProduct(editingProduct.id, formData);
          message.success('产品更新成功');
        } else {
          await addProduct(formData);
          message.success('产品添加成功');
        }
        setIsModalVisible(false);
        form.resetFields();
        fetchProducts();
      } catch (err) {
        message.error(err instanceof Error ? err.message : '操作失败');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      message.success('产品删除成功');
      fetchProducts();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const showModal = (product?: ProductInfo) => {
    setEditingProduct(product || null);
    if (product) {
      // 编辑模式，回填图片
      let goodImgList = [];
      let sizeImgList = [];
      try {
        const imgs = Array.isArray(product.good_img)
          ? product.good_img
          : (product.good_img ? JSON.parse(product.good_img) : []);
        goodImgList = imgs.map((url: string, idx: number) => ({
          uid: `good_img_${idx}`,
          name: url.split('/').pop(),
          status: 'done',
          url: `${API_BASE_URL}${url}`,
          response: url,
        }));

        const sizeImgs = Array.isArray(product.size_img)
          ? product.size_img
          : (product.size_img ? JSON.parse(product.size_img) : []);
        sizeImgList = sizeImgs.map((url: string, idx: number) => ({
          uid: `size_img_${idx}`,
          name: url.split('/').pop(),
          status: 'done',
          url: `${API_BASE_URL}${url}`,
          response: url,
        }));
      } catch (e) {}
      form.setFieldsValue({
        ...product,
        good_img: goodImgList,
        size_img: sizeImgList,
      });
    } else {
      // 添加模式，清空所有字段，尤其是图片
      form.resetFields();
      form.setFieldsValue({
        good_img: [],
        size_img: [],
      });
    }
    setIsModalVisible(true);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      message.error('请选择CSV文件');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadProductCSV(csvFile, imagesFolder);
      message.success(`批量添加商品成功！共添加 ${result.count} 个商品`);
      setCsvFile(null);
      setImagesFolder('');
      setUploadModalVisible(false);
      fetchProducts();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '批量添加商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (file: UploadFile, fieldName: string) => {
    if (!editingProduct?.id) {
      message.error('无法删除图片：产品ID不存在');
      return;
    }

    try {
      const filename = file.response || file.name;
      await deleteProductImage(editingProduct.id, filename);
      message.success('图片删除成功');
      
      // 更新表单中的图片列表
      const currentFiles = form.getFieldValue(fieldName) || [];
      form.setFieldsValue({
        [fieldName]: currentFiles.filter((f: UploadFile) => f.uid !== file.uid)
      });
      
      // 刷新产品列表
      fetchProducts();
    } catch (err) {
      message.error('删除图片失败');
      console.error('删除图片出错:', err);
    }
  };

  const columns = [
    {
      title: '商品ID',
      dataIndex: 'id',
      key: 'id',
      filteredValue: filteredInfo.id || null,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: {
        setSelectedKeys: (selectedKeys: React.Key[]) => void;
        selectedKeys: React.Key[];
        confirm: () => void;
        clearFilters?: () => void;
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索商品ID"
            value={selectedKeys[0] as string}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={confirm}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => {
              setFilteredInfo({});
              confirm({ closeDropdown: true });
            }}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </div>
      ),
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: string, record: ProductInfo) => record.id?.toString().toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      filteredValue: filteredInfo.name || null,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: {
        setSelectedKeys: (selectedKeys: React.Key[]) => void;
        selectedKeys: React.Key[];
        confirm: () => void;
        clearFilters?: () => void;
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索商品名称"
            value={selectedKeys[0] as string}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={confirm}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => {
              setFilteredInfo({});
              confirm({ closeDropdown: true });
            }}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </div>
      ),
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: string, record: ProductInfo) => record.name?.toString().toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: '尺码',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: '商品图片',
      dataIndex: 'good_img',
      key: 'good_img',
      render: (good_img: string | string[]) => {
        if (!good_img) return <span>无图片</span>;
        
        const images = Array.isArray(good_img) ? good_img : JSON.parse(good_img as string);
        if (!images || images.length === 0) return <span>无图片</span>;
        
        const firstImage = images[0];
        return (
          <Image
            src={`${API_BASE_URL}${firstImage}`}
            alt="商品图片"
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        );
      },
    },
    {
      title: '销售状态',
      dataIndex: 'sales_status',
      key: 'sales_status',
      filters: [
        { text: '在售', value: 'on_sale' },
        { text: '售罄', value: 'sold_out' },
        { text: '预售', value: 'pre_sale' },
      ],
      onFilter: (value: string, record: ProductInfo) => record.sales_status === value,
      render: (text: string, record: ProductInfo) => (
        <Select
          defaultValue={text || 'on_sale'}
          style={{ width: 100 }}
          onChange={async (value) => {
            try {
              const formData = new FormData();
              const productData = { ...record, sales_status: value };
              formData.append('product', JSON.stringify(productData));
              
              await updateProduct(record.id as string, formData);
              message.success('销售状态更新成功');
              fetchProducts(); // 刷新产品列表
            } catch (error) {
              message.error('更新销售状态失败');
              console.error(error);
            }
          }}
        >
          <Select.Option value="on_sale">
            <span style={{ color: '#52c41a' }}>在售</span>
          </Select.Option>
          <Select.Option value="sold_out">
            <span style={{ color: '#f5222d' }}>售罄</span>
          </Select.Option>
          <Select.Option value="pre_sale">
            <span style={{ color: '#1890ff' }}>预售</span>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: '成本价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '销售价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductInfo) => (
        <span className="space-x-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">产品管理</h2>
        <div className="space-x-2">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            批量导入
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加产品
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        onChange={(_, filters) => setFilteredInfo(filters as Record<string, string[] | null>)}
        pagination={{
          total: products.length,
          pageSize: 10,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingProduct ? "编辑产品" : "添加产品"}
        open={isModalVisible}
        onOk={handleAddEdit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={800}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="成本价"
              rules={[{ required: true, message: '请输入成本价' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="sale_price"
              label="销售价"
              rules={[{ required: true, message: '请输入销售价' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="product_code" label="货号">
              <Input />
            </Form.Item>
            <Form.Item name="pattern" label="图案">
              <Input />
            </Form.Item>
            <Form.Item name="skirt_length" label="裙长">
              <Input />
            </Form.Item>
            <Form.Item name="clothing_length" label="衣长">
              <Input />
            </Form.Item>
            <Form.Item name="style" label="风格">
              <Input />
            </Form.Item>
            <Form.Item name="pants_length" label="裤长">
              <Input />
            </Form.Item>
            <Form.Item name="sleeve_length" label="袖长">
              <Input />
            </Form.Item>
            <Form.Item name="fashion_elements" label="流行元素">
              <Input />
            </Form.Item>
            <Form.Item name="craft" label="工艺">
              <Input />
            </Form.Item>
            <Form.Item name="launch_season" label="上市年份/季节">
              <Input />
            </Form.Item>
            <Form.Item name="main_material" label="主面料成分">
              <Input />
            </Form.Item>
            <Form.Item name="color" label="颜色">
              <Input />
            </Form.Item>
            <Form.Item name="size" label="尺码">
              <Input />
            </Form.Item>
            <Form.Item name="factory_name" label="工厂名称">
              <Input />
            </Form.Item>
            <Form.Item name="sales_status" label="销售状态" initialValue="on_sale">
              <Select>
                <Select.Option value="on_sale">在售</Select.Option>
                <Select.Option value="sold_out">售罄</Select.Option>
                <Select.Option value="pre_sale">预售</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item 
            name="size_img" 
            label="尺码图片" 
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              multiple={true}
              beforeUpload={() => false}
              accept="image/*"
              onRemove={file => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除这张图片吗？删除后将无法恢复。',
                  onOk: () => handleImageDelete(file, 'size_img'),
                  okText: '确定',
                  cancelText: '取消'
                });
                return false; // 阻止默认删除行为
              }}
              defaultFileList={form.getFieldValue('size_img')}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传尺码图片</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item 
            name="good_img" 
            label="商品图片" 
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              multiple={true}
              beforeUpload={() => false}
              accept="image/*"
              onRemove={file => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除这张图片吗？删除后将无法恢复。',
                  onOk: () => handleImageDelete(file, 'good_img'),
                  okText: '确定',
                  cancelText: '取消'
                });
                return false; // 阻止默认删除行为
              }}
              defaultFileList={form.getFieldValue('good_img')}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传商品图片</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入产品"
        open={uploadModalVisible}
        onOk={handleCsvUpload}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="CSV文件">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files) {
                  setCsvFile(e.target.files[0]);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="图片文件夹路径">
            <Input
              value={imagesFolder}
              onChange={(e) => setImagesFolder(e.target.value)}
              placeholder="请输入图片文件夹路径"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
