/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import groups3 from './groups3.js';
import StageController from './stage-controller.js';
import './grade-bar.js';

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

      :host > div > canvas {
        padding: 0px;
        margin: 0px;
        border: 0px none;
        background: transparent none repeat scroll 0% 0%;
        position: absolute;
        top: 0px;
        left: 0px;
        user-select: none;
      }

      :host > div > * {
        position: absolute;
        top: 8px;
      }

      canvas.false {
        display: none;
        pointer-events: none;
      }

      canvas.hit {
        pointer-events: none;
      }
    `;
  }

  static get properties() {
    return {
      _courses: {type: Object, state: true},
    };
  }

  // connectedCallback() {
  //   super.connectedCallback();
  //   this._fetchCourses('/courses.csv');
  // }

  // async _fetchCourses(url) {
  //   const response = await fetch(url);
  //   const text = await response.text();
  //   this._courses = text.split('\n').slice(1);
  // }

  // _id(course) {
  //   const comma = course.indexOf(',');
  //   if (comma !== -1) {
  //     return course.substring(0, comma);
  //   }
  // }

  render() {
    return html`
      ${groups3.map(
        ({name, children}) => html`
          <div id=${name}>
            ${children.map(({name}) => html`<canvas class="${name}"></canvas>`)}
            <grade-bar @toggle=${this._toggleGrade} name=${name}></grade-bar>
            <canvas class="hit"></canvas>
          </div>
        `
      )}
    `;
  }

  firstUpdated() {
    this._draw();
  }

  updated() {
    let i = 0;
    groups3.forEach(({name, children}) => {
      const stages = this._stages.slice(i, i + children.length);
      const hitCanvas = this.renderRoot.querySelector(`#${name}>canvas.hit`);
      const ctx = hitCanvas.getContext('2d');
      ctx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);

      let n = 0;
      for (const stage of stages) {
        n += stage.selected.length;
        for (const item of stage.selected) {
          const {x, y, radius} = item[1].attrs;
          ctx.beginPath();
          ctx.rect(x - radius * 1.5, y - radius * 1.5, 3 * radius, 3 * radius);
          ctx.strokeStyle = 'black';
          ctx.stroke();
        }
      }

      if (n == 0) {
        hitCanvas.classList.add('false');
      } else {
        hitCanvas.classList.remove('false');
      }

      i += children.length;
    });
  }

  _toggleGrade({detail}) {
    for (const k in detail.states) {
      const v = detail.states[k];
      const stageCanvas = this.renderRoot.querySelector(
        `#${detail.name}>canvas.${k}`
      );
      if (!v) {
        stageCanvas.classList.add(v);
      } else {
        stageCanvas.classList.remove(!v);
      }
    }
  }

  _draw() {
    const colors = ['red', 'orange', 'cyan', 'green', 'blue', 'purple'];
    groups3.forEach(({name: depth1, children}) => {
      const container = this.renderRoot.getElementById(depth1);
      const rect = container.getBoundingClientRect();
      const {width, height} = rect;

      const hitCanvas = container.querySelector('canvas.hit');
      hitCanvas.width = width;
      hitCanvas.height = height;

      children.forEach(({name: depth2, children}) => {
        const stageCanvas = container.querySelector(`canvas.${depth2}`);
        stageCanvas.width = width;
        stageCanvas.height = height;
        const ctx = stageCanvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        /*
                          + H
                       +  +
                 J  +     +
      A +--------o********* B
        |     ooooooo******
        |  ooooooooooooo***
      E ooooooooooooooooooo F
        ***ooooooooooooo  |
        *******oooooo     |
      D *********o--------+ C
        +     +  I
        +  +
      G +

        */
        const BC = height;
        const DC = width;
        const slope = BC / DC;
        const EG = 200;
        const FG = Math.sqrt(Math.pow(DC, 2) + Math.pow(BC, 2));
        const FC = height - EG / 2;
        const IC = FC / slope;
        const DI = DC - IC;
        const AE = BC - EG / 2;

        const cos_FIC = DC / FG;
        const sin_DGI = cos_FIC;
        const height_EGFH = EG * sin_DGI;
        const area_EGFH = FG * height_EGFH;
        const area_EGI = (EG * DI) / 2;
        const area_EJFI = area_EGFH - area_EGI * 2;

        // denote the area weightings of EDI:EJFI:JBH to 1:j:1
        const j = area_EJFI / (area_EGI / 2);
        // the sum of weightings
        const base = 1 + j + 1;
        // points and vectors
        const Bx = DC;
        const By = 0;
        const Dx = 0;
        const Dy = BC;
        const Ex = 0;
        const Ey = BC - EG / 2;
        const Fx = DC;
        const Fy = EG / 2;
        const Jx = IC;
        const Jy = 0;
        const Ix = DC - IC;
        const Iy = BC;
        const vecEJx = Jx - Ex;
        const vecEJy = Jy - Ey;
        const vecEIx = Ix - Ex;
        const vecEIy = Iy - Ey;
        const vecEDx = Dx - Ex;
        const vecEDy = Dy - Ey;
        const vecJBx = Bx - Jx;
        const vecJBy = By - Jy;
        const vecJFx = Fx - Jx;
        const vecJFy = Fy - Jy;

        const shapes = [];
        for (const id of children) {
          let x = 0;
          let y = 0;
          let radius = 4;
          let color = '';

          let u1 = Math.random();
          let u2 = Math.random();

          const p = Math.random();
          if (p <= 1 / base) {
            // place into the left-bottom right-angled triangle EDI
            if (u1 + u2 > 1) {
              u1 = 1 - u1;
              u2 = 1 - u2;
            }
            x = vecEIx * u1 + vecEDx * u2;
            y = vecEIy * u1 + vecEDy * u2;

            y += AE;
          } else if (p <= (1 + j) / base) {
            // place into the middle parallelogram EJFI
            x = vecEJx * u1 + vecEIx * u2;
            y = vecEJy * u1 + vecEIy * u2;

            y += AE;
          } else {
            // place into the right-top right-angled triangle JBF
            if (u1 + u2 > 1) {
              u1 = 1 - u1;
              u2 = 1 - u2;
            }

            x = vecJBx * u1 + vecJFx * u2;
            y = vecJBy * u1 + vecJFy * u2;

            x += IC;
          }

          color = colors[Math.round(Math.random() * (colors.length - 1))];

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.stroke();

          shapes.push({id, x, y, radius, color, depth1, depth2});
        }

        const stage = new StageController(this, stageCanvas);
        this._stages.push(stage);
        stage.shapes = shapes;
      });
    });
  }
}

window.customElements.define('my-element', MyElement);
