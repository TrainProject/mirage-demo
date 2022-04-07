import {LitElement, html, css} from 'lit';

import './course-canvas';
import './course-panel';

export class MyElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
      }
    `;
  }

  render() {
    return html`
      <course-canvas @selected=${this._selectedCourses}></course-canvas>
      <course-panel></course-panel>
    `;
  }

  _selectedCourses({detail}) {
    const coursePanel = this.renderRoot.querySelector('course-panel');
    coursePanel.selected = detail;
  }
}

window.customElements.define('my-element', MyElement);
