import { LitElement, html, css } from "./modules/lit-all.min.js";

class PopUp extends LitElement {
  static properties = {
    message: { type: String },
    level: { type: String },
  };

  static styles = css`
    div {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      position: relative;
    }

    div p {
      min-width: 100%;
      width: 0;
    }

    div button {
      cursor: pointer;
      position: absolute;
      font-size: 8px;
      top: 0px;
      right: 0px;
      padding: 0px;
    }

    .error {
      color: red;
    }
  `;

  _click() {
    this.message = null;
  }

  render() {
    if (!this.message) {
      return;
    }

    return html`
      <div class="${this.level}">
        <button @click=${this._click}>✖️</button>
        <p>${this.message}</p>
      </div>
    `;
  }
}

customElements.define("pop-up", PopUp);
