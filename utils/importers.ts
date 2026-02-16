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
            // Detect if looks like XML or keep default? keeping default json/text logic from caller or default
            // If it doesn't parse as JSON, we still set it. User can switch to Text in UI.
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