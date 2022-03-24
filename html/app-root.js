import { LitElement, html, css } from "./modules/lit-all.min.js";
import auth from "./auth.js";
import "./sign-in.js";
import "./pop-up.js";

export default class AppRoot extends LitElement {
  static properties = {
    _state: { type: String, state: true },
    _attrs: { type: Object, state: true },
    _error: { type: Object, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background-color: lightgray;
      padding: 8px;
      width: fit-content;
      gap: 5px 0px;
    }

    .user-attributes {
      display: flex;
      flex-direction: column;
      gap: 5px 0px;
    }

    .user-attributes > div {
      display: flex;
      flex-direction: column;
    }

    .user-attributes label {
      font-size: 8px;
      color: rgba(0, 0, 0, 0.54);
    }

    .user-attributes span {
      text-decoration: underline;
    }

    .sign-out {
      display: flex;
    }

    .sign-out button {
      margin-left: auto;
    }
  `;

  constructor() {
    super();
    this._state = "signed-out";
    this._attrs = null;
    this._handler = auth.on(["signed-in", "signed-out"], ({ data }) => {
      const { state, username, attrs, error } = data;
      if (error) {
        this._error = error;
      } else {
        this._state = state;
        this._username = username;
        this._attrs = attrs;
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    auth.off(this._handler);
  }

  _signOut() {
    auth.post({
      type: "sign-out",
      state: "signed-in",
      username: this._username,
    });
  }

  _reset() {
    this._error = null;
  }

  _renderError() {
    if (!this._error) {
      return null;
    }

    return html`<pop-up
      @click=${this._reset}
      message=${this._error.message}
      level="error"
    />`;
  }

  _renderSignedIn() {
    if (!this._attrs) {
      return null;
    }

    return html`
      <div class="user-attributes">
        ${this._attrs.map(
          ({ Name, Value }) =>
            html`<div><label>${Name}</label><span>${Value}</span></div>`
        )}
      </div>
      <div class="sign-out">
        <button @click=${this._signOut}>Sign out</button>
      </div>
    `;
  }

  _renderSignedOut() {
    if (this._state == "signed-out" || !this._attrs) {
      return html`<sign-in />`;
    }
  }

  render() {
    if (!this._error && this._state == "signed-in" && !this._attrs) {
      auth.post({
        type: "get-user-attributes",
        state: this._state,
        username: this._username,
      });
    }

    return html`
      ${this._renderSignedIn()} ${this._renderSignedOut()}
      ${this._renderError()}
    `;
  }
}

customElements.define("app-root", AppRoot);
