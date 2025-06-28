// API基础URL - 智能检测局域网访问
const getApiBaseUrl = () => {
  // 根据当前访问地址智能设置后端地址
  const hostname = window.location.hostname;
  console.log('hostname', hostname);
  // 如果通过 localhost 或 127.0.0.1 访问
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // 如果通过局域网 IP 访问，使用相同的 IP
  return `http://${hostname}:5000`;
};
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = getApiBaseUrl();

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
  sales_status?: string;  // 销售状态：sold_out-售罄, on_sale-在售, pre_sale-预售
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      let errorMessage = '获取商品详情失败';
      
      if (response.status === 404) {
        errorMessage = `商品ID "${productId}" 不存在`;
      } else if (response.status === 500) {
        errorMessage = '服务器内部错误，请检查后端日志';
      } else if (response.status === 0) {
        errorMessage = 'CORS跨域错误 - 前端无法访问后端，请检查后端CORS配置';
      } else {
        try {
          const error = await response.json();
          errorMessage = error.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`网络连接失败 - 无法连接到后端服务器 (${API_BASE_URL})`);
    }
    throw error;
  }
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
      let errorMessage = '搜索失败';
      
      if (response.status === 404) {
        errorMessage = '搜索接口不存在 - 请检查后端是否正确部署了搜索功能';
      } else if (response.status === 400) {
        errorMessage = '请求参数错误 - 图片格式可能不支持或文件损坏';
      } else if (response.status === 500) {
        errorMessage = '服务器内部错误 - 后端处理图片搜索时出错，请检查后端日志';
      } else if (response.status === 0) {
        errorMessage = 'CORS跨域错误 - 前端无法访问后端搜索接口，请检查后端CORS配置';
      } else {
        // Clone the response before reading it
        const errorClone = response.clone();
        
        try {
          // Try to parse as JSON first
          const error = await response.json();
          errorMessage = error.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (jsonError) {
          // If JSON parsing fails, get the text from the cloned response
          const text = await errorClone.text();
          console.error('Non-JSON error response:', text.substring(0, 100) + '...');
          errorMessage = `HTTP ${response.status}: 服务器返回了非JSON格式的响应`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`网络连接失败 - 无法连接到后端搜索服务 (${API_BASE_URL}/api/products/search)`);
    }
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

  const response = await fetch(`${API_BASE_URL}/api/products/upload_csv`, {
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

// 批量删除产品
export const batchDeleteProductsAPI = async (productIds: React.Key[]): Promise<{ message: string; num_deleted?: number }> => {
  // 后端期望产品ID是数字
  const idsAsNumbers = productIds.map(id => Number(id)).filter(id => !isNaN(id));

  if (idsAsNumbers.length !== productIds.length) {
    // 如果有些ID无法转换为有效的数字，这可能是一个问题
    console.warn('batchDeleteProductsAPI: Some product IDs could not be converted to numbers.', productIds);
    // 可以选择抛出错误或仅使用有效的数字ID
    // throw new Error('提供的部分产品ID无效');
  }

  const response = await fetch(`${API_BASE_URL}/api/products/batch-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: idsAsNumbers }),
  });

  if (!response.ok) {
    let errorMessage = `批量删除产品失败 (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
    } catch (e) {
      // 如果响应不是JSON，尝试获取文本错误信息
      try {
        const textError = await response.text();
        if (textError) errorMessage = textError; // 使用文本错误（如果存在）
      } catch (textEx) {
        // 忽略获取文本时的错误
      }
      console.error('Failed to parse JSON error response for batch delete, or response was not JSON.');
    }
    throw new Error(errorMessage);
  }

  return response.json(); // 后端应该返回 { message: string, num_deleted?: number }
};

// 删除产品图片
export const deleteProductImage = async (productId: string, filename: string) => {
  // 确保文件名不包含开头的斜杠
  const cleanFilename = filename.replace(/^\/+/, '');
  
  const response = await fetch(`${API_BASE_URL}/api/products/images/${productId}/${cleanFilename}`, {
    method: 'DELETE',
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

// 构建向量索引（用于图片相似度检索）
export const buildVectorIndex = async (): Promise<{ message: string; status: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/products/build-vector-index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '构建向量索引失败');
  }

  return response.json();
};

// SSE 事件处理器类型定义
export interface BuildVectorIndexHandlers {
  onTotal?: (total: number) => void;
  onProgress?: (processed: number, total: number, currentProductId: string, status: string) => void;
  onComplete?: (message?: string, errors?: string[]) => void;
  onError?: (message: string) => void;
  onConnectionError?: (error: Event) => void;
}

export const buildVectorIndexSSE = (handlers: BuildVectorIndexHandlers): (() => void) => {
  const eventSource = new EventSource(`${API_BASE_URL}/api/products/build-vector-index/sse`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('SSE Data:', data);

    switch (data.type) {
      case 'total':
        handlers.onTotal?.(data.value);
        break;
      case 'progress':
        handlers.onProgress?.(
          data.processed,
          data.total,
          data.current_product_id,
          data.status
        );
        break;
      case 'complete':
        handlers.onComplete?.(data.message, data.errors);
        eventSource.close();
        break;
      case 'error':
        handlers.onError?.(data.message);
        eventSource.close();
        break;
    }
  };

  eventSource.onerror = (err) => {
    console.error('EventSource failed:', err);
    handlers.onConnectionError?.(err);
    eventSource.close();
  };

  // 返回一个清理函数，用于在需要时关闭连接
  return () => {
    eventSource.close();
  };
};

// 更新订单备注信息
export const updateOrderNotes = async (
  orderId: number | string,
  notes: { customer_notes?: string; internal_notes?: string }
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/notes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notes),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '更新订单备注失败');
  }

  return response.json();
};
