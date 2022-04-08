import {LitElement, html, css} from 'lit';
import groups3 from './groups3.json';

import './stage-canvas';
import './hit-canvas';
import './grade-bar';

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

export class CourseCanvas extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        border: solid 1px gray;
        padding: 16px;
        width: 756px;
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
            <grade-bar @toggle=${this._toggleGrade} name=${name}>
              ${children.map(
                ({name}) => html`<button name=${name}>${name}</button>`
              )}
            </grade-bar>
          </div>
        `
      )}
    `;
  }

  _selectRange(e) {
    const {name, x, y} = e.detail;
    const stageCanvases = this.renderRoot.querySelectorAll(
      `#${name}>stage-canvas:not(.false)`
    );

    const selected = new Map();
    for (const stageCanvas of stageCanvases) {
      stageCanvas.stage.nearest({x, y}).forEach((shape) => {
        selected.set(shape.key(), shape);
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

window.customElements.define('course-canvas', CourseCanvas);
