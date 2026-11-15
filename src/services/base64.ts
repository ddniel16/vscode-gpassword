export type Base64Format = "base64" | "base64url";

export function encode(text: string, format: Base64Format = "base64", includePadding = format === "base64"): string {
  if (format !== "base64" && format !== "base64url") {
    throw new Error("Unsupported Base64 encoding format.");
  }

  const encoded = Buffer.from(text, "utf-8").toString("base64");
  if (format === "base64") {
    return encoded;
  }

  const base64Url = encoded.replace(/\+/g, "-").replace(/\//g, "_");
  return includePadding ? base64Url : base64Url.replace(/=+$/, "");
}

export function decode(text: string, format: Base64Format = "base64"): string {
  if (format !== "base64" && format !== "base64url") {
    throw new Error("Unsupported Base64 encoding format.");
  }

  const pattern = format === "base64" ? /^[A-Za-z0-9+/]*={0,2}$/ : /^[A-Za-z0-9_-]*={0,2}$/;
  if (!pattern.test(text)) {
    throw new Error(`Invalid ${format === "base64" ? "Base64" : "Base64URL"} input.`);
  }

  const unpadded = text.replace(/=+$/, "");
  const suppliedPadding = text.length - unpadded.length;
  const requiredPadding = (4 - (unpadded.length % 4)) % 4;
  if (
    unpadded.length % 4 === 1 ||
    (suppliedPadding > 0 && (text.length % 4 !== 0 || suppliedPadding !== requiredPadding))
  ) {
    throw new Error(`Invalid ${format === "base64" ? "Base64" : "Base64URL"} padding.`);
  }

  const normalized = format === "base64" ? unpadded : unpadded.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Buffer.from(`${normalized}${"=".repeat(requiredPadding)}`, "base64");
  if (bytes.toString("base64").replace(/=+$/, "") !== normalized) {
    throw new Error(`Invalid ${format === "base64" ? "Base64" : "Base64URL"} encoding.`);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Encoded data is not valid UTF-8.");
  }
}
