import crypto from "node:crypto";

export type JwtJsonValue = null | boolean | number | string | JwtJsonValue[] | JwtJsonObject;
export type JwtJsonObject = { [key: string]: JwtJsonValue };
export type JwtErrorCode = "format" | "encoding" | "json" | "secret";

export class JwtError extends Error {
  public readonly code: JwtErrorCode;

  constructor(code: JwtErrorCode, message: string) {
    super(message);
    this.name = "JwtError";
    this.code = code;
  }
}

export interface DecodedJWT {
  header: JwtJsonObject;
  payload: JwtJsonObject;
  signature: string;
}

export type TemporalClaimStatus = "missing" | "valid" | "expired" | "not-yet-valid" | "invalid";

export interface TemporalClaimResult {
  status: TemporalClaimStatus;
  value?: number;
}

export interface TemporalClaims {
  exp: TemporalClaimResult;
  nbf: TemporalClaimResult;
  withinValidityWindow: boolean;
}

export type JWTVerificationResult =
  | { valid: true; algorithm: "HS256" }
  | { valid: false; algorithm: string | null; reason: "unsupported-algorithm" | "invalid-signature" };

interface ParsedJWT {
  decoded: DecodedJWT;
  signatureBytes: Buffer;
}

function isJwtJsonObject(value: JwtJsonValue): value is JwtJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeBase64UrlSegment(segment: string): Buffer {
  if (!/^[A-Za-z0-9_-]*$/.test(segment) || segment.length % 4 === 1) {
    throw new JwtError("encoding", "JWT contains an invalid Base64URL segment.");
  }

  const decoded = Buffer.from(segment, "base64url");
  if (decoded.toString("base64url") !== segment) {
    throw new JwtError("encoding", "JWT contains a non-canonical Base64URL segment.");
  }
  return decoded;
}

export function base64UrlDecode(segment: string): string {
  const bytes = decodeBase64UrlSegment(segment);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new JwtError("encoding", "JWT segment is not valid UTF-8.");
  }
}

function decodeJsonSegment(segment: string, segmentName: string): JwtJsonObject {
  let value: JwtJsonValue;
  try {
    value = JSON.parse(base64UrlDecode(segment));
  } catch (error) {
    if (error instanceof JwtError) {
      throw error;
    }
    throw new JwtError("json", `JWT ${segmentName} is not valid JSON.`);
  }

  if (!isJwtJsonObject(value)) {
    throw new JwtError("json", `JWT ${segmentName} must be a JSON object.`);
  }
  return value;
}

function parseJWT(token: string): ParsedJWT {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    throw new JwtError("format", "JWT must contain a header, payload, and signature segment.");
  }

  const header = decodeJsonSegment(parts[0], "header");
  const payload = decodeJsonSegment(parts[1], "payload");
  const signatureBytes = decodeBase64UrlSegment(parts[2]);

  return {
    decoded: {
      header,
      payload,
      signature: parts[2],
    },
    signatureBytes,
  };
}

export function validateJWT(token: string): { valid: boolean; error?: string } {
  try {
    parseJWT(token);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof JwtError ? error.message : "Could not validate JWT.",
    };
  }
}

export function decodeJWT(token: string): DecodedJWT {
  return parseJWT(token).decoded;
}

function evaluateTemporalClaim(payload: JwtJsonObject, name: "exp" | "nbf", nowSeconds: number): TemporalClaimResult {
  if (!(name in payload)) {
    return { status: "missing" };
  }

  const value = payload[name];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { status: "invalid" };
  }

  if (name === "exp") {
    return { status: nowSeconds >= value ? "expired" : "valid", value };
  }
  return { status: nowSeconds < value ? "not-yet-valid" : "valid", value };
}

export function inspectTemporalClaims(payload: JwtJsonObject, nowSeconds = Date.now() / 1000): TemporalClaims {
  if (!Number.isFinite(nowSeconds)) {
    throw new RangeError("The current time must be a finite number of seconds.");
  }

  const exp = evaluateTemporalClaim(payload, "exp", nowSeconds);
  const nbf = evaluateTemporalClaim(payload, "nbf", nowSeconds);
  return {
    exp,
    nbf,
    withinValidityWindow:
      exp.status !== "expired" &&
      exp.status !== "invalid" &&
      nbf.status !== "not-yet-valid" &&
      nbf.status !== "invalid",
  };
}

export function analyzeJWT(token: string, nowSeconds = Date.now() / 1000): DecodedJWT & { temporal: TemporalClaims } {
  const decoded = decodeJWT(token);
  return {
    ...decoded,
    temporal: inspectTemporalClaims(decoded.payload, nowSeconds),
  };
}

export function verifyJWTSignature(token: string, secret: string): JWTVerificationResult {
  if (!secret) {
    throw new JwtError("secret", "Enter the HS256 secret to verify the signature.");
  }

  const { decoded, signatureBytes } = parseJWT(token);
  const algorithm = decoded.header.alg;
  if (algorithm !== "HS256") {
    return {
      valid: false,
      algorithm: typeof algorithm === "string" ? algorithm : null,
      reason: "unsupported-algorithm",
    };
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${token.split(".")[0]}.${token.split(".")[1]}`)
    .digest();

  if (signatureBytes.length !== expectedSignature.length) {
    return { valid: false, algorithm: "HS256", reason: "invalid-signature" };
  }

  return crypto.timingSafeEqual(signatureBytes, expectedSignature)
    ? { valid: true, algorithm: "HS256" }
    : { valid: false, algorithm: "HS256", reason: "invalid-signature" };
}
