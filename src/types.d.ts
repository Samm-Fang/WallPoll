interface Request {
  method: string;
  url: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  cf: CfProperties;
}

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

interface Env {
  DB: D1Database;
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: string;
}