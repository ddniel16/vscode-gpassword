export function encode(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

export function decode(text: string): string {
  return Buffer.from(text, "base64").toString("utf-8");
}
