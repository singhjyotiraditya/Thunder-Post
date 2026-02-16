
export const generateMockData = async (schemaOrDescription: string, url: string, method: string): Promise<any> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const text = schemaOrDescription.trim();

  // 1. If empty, generate generic data based on URL
  if (!text) {
    const resource = url.split('/').pop()?.split('?')[0] || 'resource';
    return {
      id: "err_no_schema",
      message: "Please provide a JSON example or TypeScript interface in the schema tab to generate specific data.",
      generatedFor: resource
    };
  }

  // 2. If valid JSON, return it
  try {
    return JSON.parse(text);
  } catch (e) {
    // Not JSON, continue to parsing
  }

  // 3. Parse TypeScript-ish Interface
  // Example:
  // interface User {
  //   id: number;
  //   name: string;
  //   isActive: boolean;
  // }
  
  const result: any = {};
  const lines = text.split('\n');
  let isArray = text.toLowerCase().includes('list') || text.includes('[]');

  const generateValue = (key: string, type: string) => {
    const k = key.toLowerCase();
    const t = type.toLowerCase();

    if (t.includes('string')) {
        if (k.includes('email')) return 'alice@example.com';
        if (k.includes('name')) return 'Alice Smith';
        if (k.includes('phone')) return '+1-555-0123';
        if (k.includes('url') || k.includes('avatar')) return 'https://example.com/avatar.jpg';
        if (k.includes('date') || k.includes('at')) return new Date().toISOString();
        if (k.includes('id')) return crypto.randomUUID().slice(0, 8);
        return 'Sample Text';
    }
    if (t.includes('number') || t.includes('int')) {
        if (k.includes('id')) return Math.floor(Math.random() * 1000);
        if (k.includes('age')) return Math.floor(Math.random() * 50) + 18;
        if (k.includes('price') || k.includes('cost')) return +(Math.random() * 100).toFixed(2);
        return Math.floor(Math.random() * 100);
    }
    if (t.includes('boolean')) {
        return Math.random() > 0.5;
    }
    return null;
  };

  lines.forEach(line => {
    // Match "key: type" or "key?: type"
    const match = line.match(/^\s*(\w+)\??\s*:\s*(\w+)/);
    if (match) {
      const [, key, type] = match;
      result[key] = generateValue(key, type);
    }
  });

  // If we found properties, return object or array of objects
  if (Object.keys(result).length > 0) {
    if (isArray) {
        return [
            result, 
            Object.keys(result).reduce((acc, k) => ({ ...acc, [k]: generateValue(k, typeof result[k] === 'number' ? 'number' : 'string') }), {}),
            Object.keys(result).reduce((acc, k) => ({ ...acc, [k]: generateValue(k, typeof result[k] === 'number' ? 'number' : 'string') }), {})
        ];
    }
    return result;
  }

  // Fallback
  return {
    info: "Could not parse schema. Try using standard 'key: type' format.",
    originalText: text
  };
};
