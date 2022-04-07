import {LitElement, html, css} from 'lit';
import groups3 from './groups3';

import './stage-canvas';
import './hit-canvas';
import './grade-bar';

export class MyElement extends LitElement {
  _stages = [];

  static get styles() {
    return css`
      :host {
        display: block;
        border: solid 1px gray;
        padding: 16px;
        max-width: 800px;
      }

      :host > div {
        position: relative;
        width: 100%;
        height: 300px;
      }

      grade-bar {
        position: absolute;
        top: 8px;
      }

      .false {
        display: none;
      }
    `;
  }

  render() {
    return html`
      ${groups3.map(
        ({name, children}) => html`
          <div id=${name}>
            ${children.map(
              ({name, children}) =>
                html`<stage-canvas
                  name=${name}
                  .layers=${children}
                ></stage-canvas>`
            )}
            <hit-canvas @select=${this._selectRange} name=${name}></hit-canvas>
            <grade-bar @toggle=${this._toggleGrade} name=${name}></grade-bar>
          </div>
        `
      )}
    `;
  }

  _selectRange({detail}) {
    const {name, x, y} = detail;
    const stageCanvases = this.renderRoot.querySelectorAll(
      `#${name}>stage-canvas`
    );

    const selected = new Map();
    for (const stageCanvas of stageCanvases) {
      if (stageCanvas.classList.contains('false')) {
        continue;
      }
      stageCanvas.stage.nearest({x, y}).forEach((shape) => {
        selected.set(shape.id, shape);
      });
    }

    const hitCanvas = this.renderRoot.querySelector(`hit-canvas[name=${name}]`);
    hitCanvas.selected = selected;
  }

  _toggleGrade({detail}) {
    for (const k in detail.states) {
      const v = detail.states[k];
      const stageCanvas = this.renderRoot.querySelector(
        `#${detail.name}>stage-canvas[name=${k}]`
      );
      if (!v) {
        stageCanvas.classList.add(v);
      } else {
        stageCanvas.classList.remove(!v);
      }
    }
  }
}

window.customElements.define('my-element', MyElement);
