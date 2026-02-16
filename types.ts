export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface AuthConfig {
  type: AuthType;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyKey: string;
  apiKeyValue: string;
  apiKeyLocation: 'header' | 'query';
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueItem[];
  headers: KeyValueItem[];
  bodyType: 'json' | 'text' | 'schema';
  bodyContent: string;
  collectionId?: string;
  auth: AuthConfig;
}

export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
  isOpen: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValueItem[];
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  size: string;
  time: number;
  headers: Record<string, string>;
  isMock?: boolean;
}

export type TabType = 'params' | 'headers' | 'body' | 'schema' | 'auth';

export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: number;
  status?: number;
}