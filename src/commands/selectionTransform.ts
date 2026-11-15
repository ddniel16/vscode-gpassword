import * as vscode from "vscode";

export async function transformSelections(
  vscodeWindow: typeof vscode.window,
  convert: (text: string) => string,
  successMessage: string
): Promise<void> {
  const activeTextEditor = vscodeWindow.activeTextEditor;
  if (activeTextEditor === undefined) {
    vscodeWindow.showErrorMessage("No open editor");
    return;
  }

  try {
    const replacements = activeTextEditor.selections.map((selection) => ({
      selection,
      text: convert(activeTextEditor.document.getText(selection)),
    }));
    const edited = await activeTextEditor.edit((editBuilder) => {
      for (const replacement of replacements) {
        editBuilder.replace(replacement.selection, replacement.text);
      }
    });

    if (!edited) {
      vscodeWindow.showErrorMessage("Could not update the selected text.");
      return;
    }

    vscodeWindow.showInformationMessage(successMessage);
  } catch (error) {
    vscodeWindow.showErrorMessage(
      `Could not transform the selected text: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
