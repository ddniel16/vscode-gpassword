import assert from "assert";
import * as sinon from "sinon";
import { Base64 } from "../commands/base64";

suite("Base64", () => {
  let editorWindowMock: Record<string, unknown>;
  let base64: Base64;
  let activeTextEditorMock: {
    selections: Array<{ start: number; end: number }>;
    document: {
      getText: sinon.SinonStub;
    };
    edit: (callback: (editBuilder: { replace: sinon.SinonSpy }) => void) => Promise<boolean>;
  };
  let editBuilderReplaceSpy: sinon.SinonSpy;
  let showInfoMessageSpy: sinon.SinonSpy;
  let showErrorMessageSpy: sinon.SinonSpy;

  setup(() => {
    editBuilderReplaceSpy = sinon.spy();
    showInfoMessageSpy = sinon.spy();
    showErrorMessageSpy = sinon.spy();

    activeTextEditorMock = {
      selections: [{ start: 0, end: 0 }],
      document: {
        getText: sinon.stub(),
      },
      edit: (callback: (editBuilder: { replace: sinon.SinonSpy }) => void) => {
        callback({ replace: editBuilderReplaceSpy });
        return Promise.resolve(true);
      },
    };

    editorWindowMock = {
      activeTextEditor: activeTextEditorMock,
      showInformationMessage: showInfoMessageSpy,
      showErrorMessage: showErrorMessageSpy,
    };

    base64 = new Base64(editorWindowMock);
  });

  test("should encode selected text to Base64", () => {
    activeTextEditorMock.selections = [{ start: 0, end: 4 }];
    activeTextEditorMock.document.getText.onFirstCall().returns("test");

    base64.encode();

    assert(editBuilderReplaceSpy.calledOnce);
    const encoded = Buffer.from("test", "utf-8").toString("base64");
    assert(editBuilderReplaceSpy.calledWith({ start: 0, end: 4 }, encoded));
    assert(showInfoMessageSpy.calledWith("Selection encoded to Base64"));
  });

  test("should show error if no editor is open on encode", () => {
    editorWindowMock.activeTextEditor = undefined;
    base64.encode();
    assert(showErrorMessageSpy.calledWith("No open editor"));
  });

  test("should decode selected Base64 text", () => {
    activeTextEditorMock.selections = [{ start: 0, end: 8 }];
    const encoded = Buffer.from("decode", "utf-8").toString("base64");
    activeTextEditorMock.document.getText.onFirstCall().returns(encoded);

    base64.decode();

    assert(editBuilderReplaceSpy.calledOnce);
    assert(editBuilderReplaceSpy.calledWith({ start: 0, end: 8 }, "decode"));
    assert(showInfoMessageSpy.calledWith("Selection decoded from Base64"));
  });

  test("should show error if no editor is open on decode", () => {
    editorWindowMock.activeTextEditor = undefined;
    base64.decode();
    assert(showErrorMessageSpy.calledWith("No open editor"));
  });
});
