export function encode(text: string): string {
  return encodeURIComponent(text);
}

export function decode(text: string): string {
  return decodeURIComponent(text);
}
