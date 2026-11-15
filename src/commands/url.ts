import * as vscode from "vscode";
import * as urlService from "../services/url";
import { transformSelections } from "./selectionTransform";

export class Url {
  constructor(private readonly vscodeWindow: typeof vscode.window) {}

  encode(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.encode(text), "Selection URL encoded");
  }

  decode(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.decode(text), "Selection URL decoded");
  }

  encodeUri(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.encode(text, "uri"), "Full URL encoded");
  }

  decodeUri(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.decode(text, "uri"), "Full URL decoded");
  }

  encodeForm(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.encode(text, "form"), "Form data URL encoded");
  }

  decodeForm(): Promise<void> {
    return transformSelections(this.vscodeWindow, (text) => urlService.decode(text, "form"), "Form data URL decoded");
  }
}
