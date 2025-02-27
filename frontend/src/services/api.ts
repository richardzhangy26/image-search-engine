const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface ProductInfo {
  product_id: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  description: string;
}

export interface SearchResult {
  product_id: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  description: string;
  similarity: number;
  image_path: string;
  original_path?: string; // 添加原始路径用于调试
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

  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '搜索失败');
  }

  return response.json();
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
