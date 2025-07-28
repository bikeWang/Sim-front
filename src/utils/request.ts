/**
 * HTTP请求工具类
 * 自动添加refreshToken到所有请求头
 */

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}

/**
 * 统一的HTTP请求方法
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise<Response>
 */
export const request = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  // 从localStorage获取tokens
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // 设置默认headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 添加accessToken到Authorization头
  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // 添加refreshToken到请求头
  if (refreshToken) {
    defaultHeaders['X-Refresh-Token'] = refreshToken;
  }
  
  // 合并headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };
  
  // 发送请求
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
};

/**
 * GET请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export const get = async <T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const response = await request(url, {
    method: 'GET',
    ...options,
  });
  
  return response.json();
};

/**
 * POST请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export const post = async <T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const response = await request(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  return response.json();
};

/**
 * PUT请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export const put = async <T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const response = await request(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  return response.json();
};

/**
 * DELETE请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export const del = async <T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const response = await request(url, {
    method: 'DELETE',
    ...options,
  });
  
  return response.json();
};

/**
 * PATCH请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export const patch = async <T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const response = await request(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  return response.json();
};

// 导出默认对象
export default {
  request,
  get,
  post,
  put,
  delete: del,
  patch,
};