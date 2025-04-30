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
  cf: CfProperties; // 添加 cf 属性
}

// Cloudflare Workers 运行时提供的 cf 属性类型
interface CfProperties {
  asn: number;
  colo: string;
  city: string;
  country: string;
  continent: string;
  latitude: string;
  longitude: string;
  postalCode: string;
  metroCode: string;
  region: string;
  regionCode: string;
  timezone: string;
  clientAcceptEncoding: string;
  edgeRequestIp: string;
  edgeRequestKeepAliveEnabled: boolean;
  edgeRequestTlsCipher: string;
  edgeRequestTlsVersion: string;
  edgeRequestHost: string;
  edgeRequestProtocol: string;
  edgeRequestTcpRtt: number;
  edgeRequestTimeToFirstByte: number;
  edgeRequestKeepAliveHit: boolean;
  edgeResponseResultType: string;
  edgeResponseBytesSent: number;
  edgeResponseLatency: number;
  clientTrustScore: number;
  clientTcpRtt: number;
  clientApplicationRtt: number;
  clientConnectionLatency: number;
}


// 添加 Env 接口定义
interface Env {
  DB: D1Database; // 对应 wrangler.toml 中的 D1 绑定
  __STATIC_CONTENT: KVNamespace; // 对应 Workers Sites 的 KV 绑定
  __STATIC_CONTENT_MANIFEST: string; // Workers Sites 的 manifest
}

// 声明 Cloudflare Workers 运行时提供的全局变量
declare
