import {BaseCanvas} from './base-canvas';
import MouseController from './mouse-controller';

export class HitCanvas extends BaseCanvas {
  _mouse = new MouseController(this);

  static get properties() {
    return {
      name: {type: String},
      selected: {type: Object},
    };
  }

  shouldUpdate(changedProperties) {
    if (changedProperties.has('selected')) {
      const previous = changedProperties.get('selected');
      if (previous === undefined) {
        return true;
      }

      for (const k of previous.keys()) {
        // some key deleted
        if (!this.selected.has(k)) {
          return true;
        }
      }

      for (const k of this.selected.keys()) {
        // some key added
        if (!previous.has(k)) {
          return true;
        }
      }

      return false;
    }
    return true;
  }

  updated() {
    const ctx = this.context;
    this.selected?.forEach((value) => {
      const {x, y, radius} = value;

      ctx.beginPath();
      ctx.rect(x - radius * 1.5, y - radius * 1.5, 3 * radius, 3 * radius);
      ctx.strokeStyle = 'black';
      ctx.stroke();
    });

    if (this._mouse.isOver) {
      this.dispatchEvent(
        new CustomEvent('select', {
          detail: {x: this._mouse.x, y: this._mouse.y, name: this.name},
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

window.customElements.define('hit-canvas', HitCanvas);
