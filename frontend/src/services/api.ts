// API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export interface ProductInfo {
  id?: string;
  name: string;
  description: string;
  price: number;
  sale_price: number;
  product_code?: string;        // 货号
  pattern?: string;            // 图案
  skirt_length?: string;       // 裙长
  clothing_length?: string;    // 衣长
  style?: string;             // 风格
  pants_length?: string;      // 裤长
  sleeve_length?: string;     // 袖长
  fashion_elements?: string;  // 流行元素
  craft?: string;            // 工艺
  launch_season?: string;    // 上市年份/季节
  main_material?: string;    // 主面料成分
  color?: string;           // 颜色
  size?: string;           // 尺码
  size_img?: string;      // 尺码图片URL
  good_img?: string;      // 商品图片URL
  factory_name?: string;  // 工厂名称
}

export interface SearchResult extends ProductInfo {
  similarity: number;
  image_path: string;
  original_path?: string;
}

export interface ProductDetails extends ProductInfo {
  image_path: string;
  features?: string[];
  specs?: Record<string, string>;
}

export interface Customer {
  id: number;
  name: string;
  wechat: string;
  phone: string;
  default_address: string;
  address_history: string[];
}

export interface AddressInfo {
  name: string;
  wechat: string;
  phone: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
}

// Helper function to get full image URL
export const getImageUrl = (imagePath: string): string => {
  // If the path already starts with http or https, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Fix duplicate /api/ in the path
  if (imagePath.startsWith('/api/')) {
    // Remove the leading /api/ to avoid duplication
    imagePath = imagePath.substring(5);
  }
  
  // Handle special paths for product images
  if (imagePath.includes('商品信息/商品图/') || imagePath.includes('/商品信息/商品图/')) {
    // Make sure it starts with /
    if (!imagePath.startsWith('/')) {
      imagePath = '/' + imagePath;
    }
    
    // Log special handling
    console.log('Special handling for product image path:', imagePath);
  }
  
  // If the path doesn't start with /, add it
  if (!imagePath.startsWith('/')) {
    imagePath = '/' + imagePath;
  }
  
  // Log the constructed URL for debugging
  const fullUrl = `${API_BASE_URL}${imagePath}`;
  console.log('Constructed image URL:', fullUrl);
  
  return fullUrl;
};

export const getProductById = async (productId: string): Promise<ProductInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '获取商品详情失败');
  }

  return response.json();
};

export const uploadProduct = async (
  productInfo: ProductInfo,
  images: File[]
): Promise<{ message: string; product_id: string }> => {
  const formData = new FormData();
  formData.append('product', JSON.stringify(productInfo));
  
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '添加商品失败');
  }

  return response.json();
};


export const searchProducts = async (
  image: File,
  topK: number = 5
): Promise<{ results: SearchResult[] }> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('top_k', topK.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/api/products/search`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Clone the response before reading it
      const errorClone = response.clone();
      
      try {
        // Try to parse as JSON first
        const error = await response.json();
        throw new Error(error.error || '搜索失败');
      } catch (jsonError) {
        // If JSON parsing fails, get the text from the cloned response
        const text = await errorClone.text();
        console.error('Non-JSON error response:', text.substring(0, 100) + '...');
        throw new Error('服务器返回了非JSON格式的响应，请检查服务器日志');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Search request failed:', error);
    throw error instanceof Error ? error : new Error('搜索请求失败');
  }
};

export const uploadProductCSV = async (
  csvFile: File,
  imagesFolder: string
): Promise<{ message: string; count: number }> => {
  const formData = new FormData();
  formData.append('csv_file', csvFile);
  formData.append('images_folder', imagesFolder);

  const response = await fetch(`${API_BASE_URL}/products/csv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'CSV批量上传失败');
  }

  return response.json();
};

// Parse and save customer address information
export const parseAndSaveAddress = async (text: string): Promise<AddressInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/customers/parse-address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to parse address');
  }

  return response.json();
};

// Add new customer
export const addCustomer = async (customerInfo: AddressInfo): Promise<{ message: string; customer_id: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerInfo),
  });

  if (!response.ok) {
    throw new Error('Failed to add customer');
  }

  return response.json();
};

// 获取所有产品
export const getProducts = async (): Promise<ProductInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/api/products`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '获取产品列表失败');
  }
  return response.json();
};

// 添加产品
export const addProduct = async (formData: FormData): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '添加产品失败');
  }

  return response.json();
};

// 更新产品
export const updateProduct = async (productId: string, formData: FormData): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新产品失败');
  }

  return response.json();
};

// 删除产品
export const deleteProduct = async (productId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除产品失败');
  }

  return response.json();
};

// 删除产品图片
export const deleteProductImage = async (productId: string, filename: string) => {
  // 确保文件名不包含开头的斜杠
  const cleanFilename = filename.replace(/^\/+/, '');
  
  const response = await fetch(`${API_BASE_URL}/api/products/images/${productId}/${cleanFilename}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除图片失败');
  }
  
  return await response.json();
};
