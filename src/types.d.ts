interface Request {
  method: string;
  url: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare class Response {
  constructor(body: any, init?: ResponseInit);
  status: number;
  headers: Headers;
}

interface Headers {
  get(name: string): string | null;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
}

interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Headers | Record<string, string>;
}

declare var URL: {
  new(url: string, base?: string): URL;
};

declare var fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

interface URL {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}
