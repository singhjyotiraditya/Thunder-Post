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

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueItem[];
  headers: KeyValueItem[];
  bodyType: 'json' | 'text' | 'schema'; // 'schema' is for AI mocking
  bodyContent: string;
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
  isOpen: boolean;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  size: string;
  time: number; // milliseconds
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