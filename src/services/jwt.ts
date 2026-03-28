export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  base64 += padding;
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function validateJWT(token: string): { valid: boolean; error?: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Invalid JWT" };
  }

  const isValid = parts.every((part) => /^[A-Za-z0-9-_]*$/.test(part));
  if (!isValid) {
    return { valid: false, error: "Invalid JWT" };
  }

  return { valid: true };
}

export function decodeJWT(token: string): { header: object; payload: object; signature: string } {
  const [header, payload, signature] = token.split(".");
  return {
    header: JSON.parse(base64UrlDecode(header)),
    payload: JSON.parse(base64UrlDecode(payload)),
    signature: signature,
  };
}
