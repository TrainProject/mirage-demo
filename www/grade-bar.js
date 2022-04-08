import {LitElement, html, css} from 'lit';

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

      ::slotted(button) {
        height: 18px;
        font-size: 8px;
        background-color: white;
      }

      ::slotted(button.off) {
        background-color: #e0e0e0;
      }

      ::slotted(button[name='njx0012']) {
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

  _toggle({target}) {
    const grade = target.getAttribute('name');
    this._states = {
      ...this._states,
      [grade]: this._states?.[grade] === false,
    };

    if (this._states[grade] === false) {
      target.classList.add('off');
    } else {
      target.classList.remove('off');
    }

    this.dispatchEvent(
      new CustomEvent('toggle', {
        detail: {name: this.name, states: this._states},
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <span class="${this.name}">${this.name}</span>
      <div class="container">
        <slot @click=${this._toggle}></slot>
      </div>
    `;
  }
}

window.customElements.define('grade-bar', GradeBar);
