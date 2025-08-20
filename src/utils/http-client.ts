import fetch, { RequestInit } from "node-fetch";
import { IHttpClient } from "../interfaces/http-client.interface";
import { HttpRequestConfig, HttpResponse } from "../types/driver-types";

/**
 * Framework-agnostic HTTP client implementation using node-fetch
 * This can be easily replaced with any other HTTP library
 */
export class HttpClient implements IHttpClient {
  private readonly defaultTimeout: number;

  constructor(timeout = 10000) {
    if (timeout <= 0) {
      throw new Error("Timeout must be a positive number");
    }
    this.defaultTimeout = timeout;
  }

  async request<T = unknown>(
    config: HttpRequestConfig,
  ): Promise<HttpResponse<T>> {
    const {
      method,
      url,
      headers = {},
      data,
      timeout = this.defaultTimeout,
    } = config;

    this.validateRequestConfig(config);

    const requestOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      const responseData = await this.parseResponse<T>(response);

      // Convert node-fetch headers to plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        responseHeaders[key] = value;
      });

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const err = error as Error;
      if (err.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw new Error(`HTTP request failed: ${err.message}`);
    }
  }

  async get<T = unknown>(
    url: string,
    config: Partial<HttpRequestConfig> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: "GET",
      url,
      ...config,
    });
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config: Partial<HttpRequestConfig> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data,
      ...config,
    });
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config: Partial<HttpRequestConfig> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: "PUT",
      url,
      data,
      ...config,
    });
  }

  async delete<T = unknown>(
    url: string,
    config: Partial<HttpRequestConfig> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: "DELETE",
      url,
      ...config,
    });
  }

  /**
   * Validate request configuration
   */
  private validateRequestConfig(config: HttpRequestConfig): void {
    if (!config.url) {
      throw new Error("URL is required");
    }

    if (!config.method) {
      throw new Error("HTTP method is required");
    }

    try {
      new URL(config.url);
    } catch {
      throw new Error("Invalid URL format");
    }
  }

  /**
   * Parse response data based on content type
   */
  private async parseResponse<T>(response: fetch.Response): Promise<T> {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    } else {
      return (await response.text()) as unknown as T;
    }
  }
}
