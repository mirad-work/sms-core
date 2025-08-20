import { HttpRequestConfig, HttpResponse } from "../types/driver-types";

/**
 * HTTP client interface for making requests
 * This abstraction allows for different HTTP implementations
 */
export interface IHttpClient {
  /**
   * Make an HTTP request
   */
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * Make a GET request
   */
  get<T = any>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>>;

  /**
   * Make a POST request
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>>;

  /**
   * Make a PUT request
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>>;

  /**
   * Make a DELETE request
   */
  delete<T = any>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResponse<T>>;
}
