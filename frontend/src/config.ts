// 根据环境变量设置 API 地址
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : `http://${window.location.hostname}:5000`;
