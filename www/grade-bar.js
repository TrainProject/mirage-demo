import {LitElement, html, css} from 'lit';
import groups3 from './groups3.js';

// const dictionary = {
//   // xd0001: '小学',
//   // xd0002: '初中',
//   // xd0003: '高中',
//   // njs001: '一年级上',
//   // njx001: '一年级下',
//   // njs002: '二年级上',
//   // njx002: '二年级下',
//   // njs003: '三年级上',
//   // njx003: '三年级下',
//   // njs004: '四年级上',
//   // njx004: '四年级下',
//   // njs005: '五年级上',
//   // njx005: '五年级下',
//   // njs006: '六年级上',
//   // njx006: '六年级下',
// };

export class GradeBar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      span {
        height: 100%;
        line-height: 36px;
      }

      div.container {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        height: 36px;
      }

      button {
        height: 18px;
        font-size: 8px;
      }

      button.on {
        background-color: white;
      }

      .njx0012 {
        height: 100%;
      }
    `;
  }

  static get properties() {
    return {
      name: {type: String},
      _states: {type: Object, state: true},
    };
  }

  constructor() {
    super();
    this._states = {};
  }

  _toggle(grade) {
    this._states = {
      ...this._states,
      [grade]: this._states?.[grade] === false,
    };

    this.dispatchEvent(
      new CustomEvent('toggle', {
        detail: {name: this.name, states: this._states},
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const options = [];
    for (const item of groups3) {
      if (item.name == this.name) {
        item.children.forEach((item) => {
          options.push(item.name);
        });
      }
    }

    return html`
      <span class="${this.name}">${this.name}</span>
      <div class="container">
        ${options.map(
          (opt) =>
            html`<button
              @click=${() => this._toggle(opt)}
              class="${opt} ${this._states[opt] === false ? 'off' : 'on'}"
            >
              ${opt}
            </button>`
        )}
      </div>
    `;
  }
}

window.customElements.define('grade-bar', GradeBar);
