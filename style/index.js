// Third-party chat UI styles must be bundled into the extension's style
// module so they load in the prebuilt (deployed) extension — not just in
// local dev. Without this, @chatscope components (message list, input,
// send button) render unstyled on the server.
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './base.css';
