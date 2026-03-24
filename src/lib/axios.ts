/** @format */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { LocalToken, LocalRefreshToken } from "./var";

interface ApiConfig {
  baseURL?: string;
  timeout?: number;
}

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null;

  constructor(config: ApiConfig = {}) {
    this.instance = axios.create({
      baseURL:
        config.baseURL ||
        process.env.NEXT_PUBLIC_API ||
        "http://localhost:8000/api/v1",
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.token = null;
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();

        if (token && config.headers) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    if (this.token) {
      return this.token;
    } else {
      if (typeof window !== "undefined") {
        const storedToken =
          localStorage.getItem(LocalToken) || this.getCookie(LocalToken);
        this.token = storedToken;
        return storedToken;
      }

      return null;
    }
  }

  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number = 7) {
    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  }

  private removeCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  public setTokens(token: string) {
    this.token = token;

    if (typeof window !== "undefined") {
      localStorage.setItem(LocalToken, token);
      this.setCookie(LocalToken, token);
    }
  }

  public clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LocalToken);
      localStorage.removeItem(LocalRefreshToken);
      this.removeCookie(LocalToken);
      this.removeCookie(LocalRefreshToken);
      this.token = null;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  get api(): AxiosInstance {
    return this.instance;
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

const AxiosClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API || "http://localhost:8000/api/v1",
  timeout: 10000,
});

export default AxiosClient;
