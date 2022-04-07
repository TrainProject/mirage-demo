import {LitElement, html, css} from 'lit';

export class BaseCanvas extends LitElement {
  canvas;

  static get styles() {
    return css`
      canvas {
        padding: 0px;
        margin: 0px;
        border: 0px none;
        background: transparent none repeat scroll 0% 0%;
        position: absolute;
        top: 0px;
        left: 0px;
        user-select: none;
        width: 100%;
        height: 100%;
      }
    `;
  }

  render() {
    return html`<canvas></canvas>`;
  }

  firstUpdated() {
    this.canvas = this.renderRoot.querySelector('canvas');
  }

  get context() {
    const canvas = this.canvas;
    const rect = canvas.getBoundingClientRect();
    const {width, height} = rect;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    return ctx;
  }
}
