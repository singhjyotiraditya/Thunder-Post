import { ApiRequest, Collection, HttpMethod, KeyValueItem, AuthConfig } from '../types';

const uuid = () => crypto.randomUUID();

const createEmptyAuth = (): AuthConfig => ({
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKeyKey: '',
  apiKeyValue: '',
  apiKeyLocation: 'header'
});

// --- HELPER: Resolve JSON Pointer References ---
const resolveRef = (ref: string, root: any) => {
    if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
    const parts = ref.substring(2).split('/');
    let current = root;
    for (const part of parts) {
        current = current?.[part];
        if (!current) return null;
    }
    return current;
};

// --- HELPER: Generate Example Data from Schema ---
const generateExampleFromSchema = (schema: any, root: any, depth = 0): any => {
    if (depth > 8) return null; // Prevent infinite recursion

    if (!schema) return null;

    // Handle $ref
    if (schema.$ref) {
        const resolved = resolveRef(schema.$ref, root);
        return resolved ? generateExampleFromSchema(resolved, root, depth + 1) : null;
    }

    // Handle allOf (Merge properties)
    if (schema.allOf) {
        let merged: any = {};
        schema.allOf.forEach((sub: any) => {
            const example = generateExampleFromSchema(sub, root, depth + 1);
            if (typeof example === 'object' && example !== null) {
                merged = { ...merged, ...example };
            }
        });
        return merged;
    }

    // Prioritize explicit examples/defaults
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;

    // Handle Enums
    if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum[0];
    }

    // Handle Objects
    if (schema.type === 'object' || schema.properties) {
        const obj: any = {};
        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                obj[key] = generateExampleFromSchema(schema.properties[key], root, depth + 1);
            });
        }
        return obj;
    }

    // Handle Arrays
    if (schema.type === 'array') {
        if (schema.items) {
            // Check if items is an array of schemas (tuple) or single schema
            if (Array.isArray(schema.items)) {
                 return schema.items.map((item: any) => generateExampleFromSchema(item, root, depth + 1));
            }
            return [generateExampleFromSchema(schema.items, root, depth + 1)];
        }
        return [];
    }

    // Handle Primitives
    if (schema.type === 'string') {
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uuid') return '3fa85f64-5717-4562-b3fc-2c963f66afa6';
        return 'string';
    }
    if (schema.type === 'integer' || schema.type === 'number') return 0;
    if (schema.type === 'boolean') return true;

    return null;
};

export const parsePostmanCollection = (data: any): Collection => {
    const requests: ApiRequest[] = [];
    const collectionId = uuid();

    const processItems = (items: any[]) => {
        items.forEach(item => {
            if (item.request) {
                // It's a request
                const req: ApiRequest = {
                    id: uuid(),
                    name: item.name || 'Untitled Request',
                    method: (item.request.method?.toUpperCase() as HttpMethod) || HttpMethod.GET,
                    url: '',
                    params: [{ id: uuid(), key: '', value: '', enabled: true }],
                    headers: [{ id: uuid(), key: '', value: '', enabled: true }],
                    bodyType: 'json',
                    bodyContent: '',
                    collectionId: collectionId,
                    auth: createEmptyAuth()
                };

                // URL
                if (typeof item.request.url === 'string') {
                    req.url = item.request.url;
                } else if (item.request.url?.raw) {
                    req.url = item.request.url.raw;
                }

                // Headers
                if (Array.isArray(item.request.header)) {
                    req.headers = item.request.header.map((h: any) => ({
                        id: uuid(),
                        key: h.key,
                        value: h.value,
                        enabled: !h.disabled
                    }));
                    req.headers.push({ id: uuid(), key: '', value: '', enabled: true });
                }

                // Body
                if (item.request.body?.mode === 'raw') {
                    req.bodyContent = item.request.body.raw;
                    req.bodyType = 'json'; // Default assumption
                    // Check language
                    if (item.request.body.options?.raw?.language === 'text') {
                        req.bodyType = 'text';
                    }
                }

                // Auth
                if (item.request.auth) {
                    if (item.request.auth.type === 'bearer') {
                        req.auth.type = 'bearer';
                        req.auth.bearerToken = item.request.auth.bearer?.[0]?.value || '';
                    } else if (item.request.auth.type === 'basic') {
                        req.auth.type = 'basic';
                        const user = item.request.auth.basic?.find((x: any) => x.key === 'username')?.value;
                        const pass = item.request.auth.basic?.find((x: any) => x.key === 'password')?.value;
                        req.auth.basicUsername = user || '';
                        req.auth.basicPassword = pass || '';
                    } else if (item.request.auth.type === 'apikey') {
                         req.auth.type = 'apikey';
                         const key = item.request.auth.apikey?.find((x: any) => x.key === 'key')?.value;
                         const val = item.request.auth.apikey?.find((x: any) => x.key === 'value')?.value;
                         const loc = item.request.auth.apikey?.find((x: any) => x.key === 'in')?.value;
                         req.auth.apiKeyKey = key || '';
                         req.auth.apiKeyValue = val || '';
                         req.auth.apiKeyLocation = loc === 'query' ? 'query' : 'header';
                    }
                }

                requests.push(req);
            } else if (item.item) {
                // Folder - flatten for now
                processItems(item.item);
            }
        });
    };

    if (data.item) {
        processItems(data.item);
    }

    return {
        id: collectionId,
        name: data.info?.name || 'Imported Collection',
        requests,
        isOpen: true
    };
};

export const parseSwagger = (data: any, sourceUrl?: string): Collection[] => {
    const collectionsMap: Record<string, Collection> = {};
    
    let baseUrl = '';
    if (data.servers?.[0]?.url) {
        baseUrl = data.servers[0].url;
    } else if (sourceUrl) {
        try {
            const u = new URL(sourceUrl);
            baseUrl = u.origin;
        } catch {
            baseUrl = '';
        }
    }

    // Helper to get or create collection by tag
    const getCollection = (tag: string) => {
        if (!collectionsMap[tag]) {
            collectionsMap[tag] = {
                id: uuid(),
                name: tag,
                requests: [],
                isOpen: true
            };
        }
        return collectionsMap[tag];
    };

    // Iterate Paths
    if (data.paths) {
        Object.entries(data.paths).forEach(([path, methods]: [string, any]) => {
            Object.entries(methods).forEach(([methodStr, op]: [string, any]) => {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(methodStr.toLowerCase())) {
                    const tagName = op.tags?.[0] || 'Default';
                    const collection = getCollection(tagName);
                    const collectionId = collection.id;

                    const req: ApiRequest = {
                        id: uuid(),
                        name: op.summary || op.operationId || `${methodStr.toUpperCase()} ${path}`,
                        method: methodStr.toUpperCase() as HttpMethod,
                        url: `${baseUrl}${path}`.replace(/(?<!:)\/\//g, '/'), // Normalize slashes but keep protocol://
                        params: [{ id: uuid(), key: '', value: '', enabled: true }],
                        headers: [{ id: uuid(), key: '', value: '', enabled: true }],
                        bodyType: 'json',
                        bodyContent: '',
                        collectionId: collectionId,
                        auth: createEmptyAuth()
                    };

                    // Handle Parameters
                    if (op.parameters && Array.isArray(op.parameters)) {
                        op.parameters.forEach((p: any) => {
                            // Extract schema if present directly or nested
                            const schema = p.schema || p;
                            const defaultValue = schema.default !== undefined 
                                ? String(schema.default) 
                                : (schema.example !== undefined ? String(schema.example) : '');

                            if (p.in === 'query') {
                                req.params.push({
                                    id: uuid(),
                                    key: p.name,
                                    value: defaultValue,
                                    enabled: p.required || false
                                });
                            } else if (p.in === 'header') {
                                req.headers.push({
                                    id: uuid(),
                                    key: p.name,
                                    value: defaultValue,
                                    enabled: p.required || false
                                });
                            }
                            // Note: 'path' parameters are implicitly handled by the URL string.
                            // ThunderPost doesn't currently have a dedicated 'Path Variables' table,
                            // users typically replace {id} manually.
                        });
                    }

                    // Remove empty init param/header if we added real ones, but keep one empty at end
                    if (req.params.length > 1) {
                         const empty = req.params.shift(); 
                         if(empty) req.params.push(empty);
                    }
                    if (req.headers.length > 1) {
                        const empty = req.headers.shift();
                        if(empty) req.headers.push(empty);
                    }

                    // Handle Body
                    if (op.requestBody) {
                        const content = op.requestBody.content;
                        if (content) {
                            // Prefer JSON
                            const jsonContent = content['application/json'];
                            if (jsonContent && jsonContent.schema) {
                                try {
                                    const example = generateExampleFromSchema(jsonContent.schema, data);
                                    req.bodyContent = JSON.stringify(example, null, 2);
                                } catch (e) {
                                    req.bodyContent = '{}';
                                }
                            }
                        }
                    }

                    collection.requests.push(req);
                }
            });
        });
    }

    return Object.values(collectionsMap);
};

export const parseCurl = (curl: string): ApiRequest => {
    const req: ApiRequest = {
        id: uuid(),
        name: 'Imported cURL',
        method: HttpMethod.GET,
        url: '',
        params: [{ id: uuid(), key: '', value: '', enabled: true }],
        headers: [{ id: uuid(), key: '', value: '', enabled: true }],
        bodyType: 'json',
        bodyContent: '',
        auth: createEmptyAuth()
    };

    // Normalize: remove newlines/backslashes
    // We treat newlines as spaces to handle multiline cURL commands
    const cleanCurl = curl.replace(/\\\n/g, ' ').replace(/[\n\r]+/g, ' ').trim();

    // Method
    const methodMatch = cleanCurl.match(/-X\s+([A-Z]+)/) || cleanCurl.match(/--request\s+([A-Z]+)/);
    if (methodMatch) req.method = (methodMatch[1] as HttpMethod) || HttpMethod.GET;

    // URL
    const urlMatch = cleanCurl.match(/['"](https?:\/\/[^'"]+)['"]/) || cleanCurl.match(/(https?:\/\/[^\s"']+)/);
    if (urlMatch) req.url = urlMatch[1];

    // Headers
    // Supports -H 'key: value' and -H "key: value"
    const headerRegex = /-H\s+(?:'([^']*)'|"((?:[^"\\]|\\.)*)")/g;
    let match;
    const headers: KeyValueItem[] = [];
    while ((match = headerRegex.exec(cleanCurl)) !== null) {
        let content = match[1] || match[2];
        if (match[2]) {
             // Unescape double quotes
             content = content.replace(/\\"/g, '"');
        }
        
        if (content) {
            const [key, ...values] = content.split(':');
            const value = values.join(':');
            if (key && value !== undefined) {
                headers.push({ id: uuid(), key: key.trim(), value: value.trim(), enabled: true });
            }
        }
    }

    // Auth Header Check
    const authHeader = headers.find(h => h.key.toLowerCase() === 'authorization');
    if (authHeader && authHeader.value.toLowerCase().startsWith('bearer ')) {
        req.auth.type = 'bearer';
        req.auth.bearerToken = authHeader.value.substring(7).trim();
        const idx = headers.findIndex(h => h.id === authHeader.id);
        if (idx !== -1) headers.splice(idx, 1);
    }

    if (headers.length > 0) {
        req.headers = [...headers, { id: uuid(), key: '', value: '', enabled: true }];
    }

    // Body
    // Supports -d '...' and -d "..." and --data / --data-raw
    const dataRegex = /(?:-d|--data|--data-raw)\s+(?:'([^']*)'|"((?:[^"\\]|\\.)*)")/;
    const dataMatch = cleanCurl.match(dataRegex);
    
    if (dataMatch) {
        let body = dataMatch[1] || dataMatch[2];
        if (dataMatch[2]) {
             body = body.replace(/\\"/g, '"');
        }
        
        // Try to pretty print if it's JSON
        try {
            const parsed = JSON.parse(body);
            req.bodyContent = JSON.stringify(parsed, null, 2);
            req.bodyType = 'json';
        } catch {
            req.bodyContent = body;
        }

        if (req.method === HttpMethod.GET) req.method = HttpMethod.POST;
    }

    // Basic Auth
    const userMatch = cleanCurl.match(/-u\s+['"]?([^'"]+)['"]?/);
    if (userMatch) {
        const [user, pass] = userMatch[1].split(':');
        req.auth.type = 'basic';
        req.auth.basicUsername = user;
        req.auth.basicPassword = pass || '';
    }

    return req;
};