import { ConsoleLoggingListener, LocalStorage, SessionStorage } from "./speechToText/common.browser/Exports";
import { Events, Storage } from "./speechToText/common/Exports";

// Common.Storage.SetLocalStorage(new Common.Browser.LocalStorage());
// Common.Storage.SetSessionStorage(new Common.Browser.SessionStorage());
Events.Instance.AttachListener(new ConsoleLoggingListener());

export * from "./speechToText/common/Exports";
export * from "./speechToText/common.browser/Exports";
export * from "./speechToText/sdk/speech/Exports";
export * from "./speechToText/sdk/speech.browser/Exports";
