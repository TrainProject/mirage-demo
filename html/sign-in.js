import { LitElement, html, css } from "./modules/lit-all.min.js";
import auth from "./auth.js";
import "./pop-up.js";

class SignIn extends LitElement {
  static properties = {
    _type: { type: String, state: true },
    _busy: { type: Boolean, state: true },
    _error: { type: Object, state: true },
    _empty: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  `;

  constructor() {
    super();
    this._reset();
    this._type = "send-code";
    this._username = null;
    this._handler = auth.on(["sign-in"], ({ data }) => {
      const { type, username, error } = data;
      if (error) {
        this._error = error;
      } else if (type != this._type) {
        this._reset();
        this._type = type;
        this._username = username;
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    auth.off(this._handler);
  }

  _sendCode(event) {
    this._busy = true;
    auth.post({
      state: "sign-in",
      type: this._type,
      email: event.target.querySelector("#email").value,
    });
    event.preventDefault();
  }

  _verifyCode(event) {
    this._busy = true;
    auth.post({
      state: "sign-in",
      type: this._type,
      username: this._username,
      code: event.target.querySelector("#code").value,
    });
    event.preventDefault();
  }

  _reset(event) {
    if (this._error && this._error.code == "NotAuthorizedException") {
      // re-signin again
      this._type = "send-code";
    }

    this._error = null;
    this._busy = false;
    this._empty = true;

    if (event) {
      this._checkEmpty({ target: this.renderRoot.querySelector("input") });
    }
  }

  _checkEmpty({ target }) {
    this._empty = !target.value;
  }

  _renderError() {
    if (!this._error) {
      return null;
    }

    const message =
      this._error.code == "NotAuthorizedException"
        ? "reach the maximum number of tries"
        : this._error.message;

    return html`
      <pop-up @click=${this._reset} message=${message} level="error" />
    `;
  }

  _renderForm() {
    switch (this._type) {
      case "send-code":
        return html`
          <form @submit=${this._sendCode} @input=${this._checkEmpty}>
            <label for="email">Email</label>
            <input type="email" id="email" value="" ?disabled=${this._busy} />
            <input
              type="submit"
              value="send code"
              ?disabled=${this._empty || this._busy}
            />
          </form>
        `;
      case "verify-code":
        return html`
          <form @submit=${this._verifyCode} @input=${this._checkEmpty}>
            <label for="code">Code</label>
            <input type="number" id="code" value="" ?disabled=${this._busy} />
            <input
              type="submit"
              value="continue"
              ?disabled=${this._empty || this._busy}
            />
          </form>
        `;
    }
  }

  render() {
    return html`
      <h3>Sign-In</h3>
      ${this._renderForm()} ${this._renderError()}
    `;
  }
}

customElements.define("sign-in", SignIn);
