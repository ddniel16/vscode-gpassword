import * as vscode from "vscode";
import * as base64Service from "../services/base64";
import { transformSelections } from "./selectionTransform";

export class Base64 {
  constructor(private readonly vscodeWindow: typeof vscode.window) {}

  encode(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => base64Service.encode(text), "Selection encoded to Base64");
  }

  decode(): Promise<void> {
    return transformSelections(
      this.vscodeWindow,
      (text) => base64Service.decode(text),
      "Selection decoded from Base64"
    );
  }

  encodeUrl(): Promise<void> {
    return transformSelections(
      this.vscodeWindow,
      (text) => base64Service.encode(text, "base64url", false),
      "Selection encoded to Base64URL"
    );
  }

  decodeUrl(): Promise<void> {
    return transformSelections(
      this.vscodeWindow,
      (text) => base64Service.decode(text, "base64url"),
      "Selection decoded from Base64URL"
    );
  }
}
