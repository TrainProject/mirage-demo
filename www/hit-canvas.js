import {BaseCanvas} from './base-canvas';
import {MouseController} from './mouse-controller';

export class HitCanvas extends BaseCanvas {
  _mouse = new (class extends MouseController {
    async onMouseMove(e) {
      super.onMouseMove(e, false);
      await this.host.updateComplete;
      this.host.dispatchEvent(
        new CustomEvent('select', {
          detail: {x: this.x, y: this.y, name: this.host.name},
          bubbles: true,
          composed: true,
        })
      );
    }
  })(this);

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

  willUpdate(changedProperties) {
    if (changedProperties.has('selected')) {
      this.dispatchEvent(
        new CustomEvent('selected', {
          detail: this.selected,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('selected')) {
      const ctx = this.context;
      this.selected.forEach((value) => {
        const {x, y, radius} = value;

        ctx.beginPath();
        ctx.rect(x - radius * 1.5, y - radius * 1.5, 3 * radius, 3 * radius);
        ctx.strokeStyle = 'black';
        ctx.stroke();
      });
    }
  }
}

window.customElements.define('hit-canvas', HitCanvas);
