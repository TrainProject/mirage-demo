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

  render() {
    if (!this.message) {
      return;
    }

    return html`
      <div class="${this.level}">
        <p>${this.message}</p>
        <button>✖️</button>
      </div>
    `;
  }
}

customElements.define("pop-up", PopUp);
