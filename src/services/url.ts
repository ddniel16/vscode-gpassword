export type UrlFormat = "component" | "uri" | "form";

export function encode(text: string, format: UrlFormat = "component"): string {
  switch (format) {
    case "component":
      return encodeURIComponent(text);
    case "uri":
      return encodeURI(text);
    case "form":
      return new URLSearchParams([["value", text]]).toString().slice("value=".length);
    default:
      throw new Error("Unsupported URL encoding format.");
  }
}

export function decode(text: string, format: UrlFormat = "component"): string {
  switch (format) {
    case "component":
      return decodeURIComponent(text);
    case "uri":
      return decodeURI(text);
    case "form":
      return decodeURIComponent(text.replace(/\+/g, " "));
    default:
      throw new Error("Unsupported URL encoding format.");
  }
}
