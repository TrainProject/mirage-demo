import {BaseCanvas} from './base-canvas';
import {StageController} from './stage-controller';

class Circle {
  stage;
  index;
  id;

  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  key() {
    if (this.id !== undefined) {
      return this.id;
    }
    if (this.index !== undefined) {
      return this.index;
    }

    throw new Error('No Key Found for circle');
  }
}

export class StageCanvas extends BaseCanvas {
  static properties = {
    name: {type: String},
    layers: {type: Array},
  };

  stage = new StageController(this);

  updated() {
    this._draw();
  }

  _draw() {
    const colors = ['red', 'orange', 'cyan', 'green', 'blue', 'purple'];
    const ctx = this.context;
    const {width, height} = ctx.canvas;

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
    for (const item of this.layers) {
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

      const shape = new Circle(x, y, radius);
      shape.stage = this.name;
      if (!isNaN(item)) {
        shape.index = item;
      } else if (typeof item === 'string') {
        shape.id = item;
      }

      shapes.push(shape);
    }
    this.stage.shapes = shapes;
  }
}

window.customElements.define('stage-canvas', StageCanvas);
