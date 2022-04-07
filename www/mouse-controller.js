export class MouseController {
  host;

  movedX = 0;
  movedY = 0;

  x = 0;
  y = 0;

  px = 0;
  py = 0;

  winX = 0;
  winY = 0;

  pwinX = 0;
  pwinY = 0;

  button = 0;
  isPressed = false;
  isOver = false;

  _hasInteracted = false;

  constructor(host) {
    this.host = host;
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    host.addController(this);
  }

  hostConnected() {
    this.host.addEventListener('mousedown', this.onMouseDown);
    this.host.addEventListener('mousemove', this.onMouseMove);
    this.host.addEventListener('mouseup', this.onMouseUp);
    this.host.addEventListener('mouseenter', this.onMouseEnter);
    this.host.addEventListener('mouseleave', this.onMouseLeave);
  }

  hostDisconnected() {
    this.host.removeEventListener('mousedown', this.onMouseDown);
    this.host.removeEventListener('mousemove', this.onMouseMove);
    this.host.removeEventListener('mouseup', this.onMouseUp);
    this.host.addEventListener('mouseenter', this.onMouseEnter);
    this.host.addEventListener('mouseleave', this.onMouseLeave);
  }

  onMouseDown(e, requestUpdate = true) {
    this.isPressed = true;
    this._setMouseButton(e);
    this._updateNextMouseCoords(e);
    if (requestUpdate) {
      this.host.requestUpdate();
    }
  }

  onMouseMove(e, requestUpdate = true) {
    this._updateNextMouseCoords(e);
    if (requestUpdate) {
      this.host.requestUpdate();
    }
  }

  onMouseUp(e, requestUpdate = true) {
    this.isPressed = false;
    if (requestUpdate) {
      this.host.requestUpdate();
    }
  }

  onMouseEnter(e, requestUpdate = true) {
    this.isOver = true;
    if (requestUpdate) {
      this.host.requestUpdate();
    }
  }

  onMouseLeave(e, requestUpdate = true) {
    this.isOver = false;
    if (requestUpdate) {
      this.host.requestUpdate();
    }
  }

  _updateNextMouseCoords(e) {
    if (!e.touches || e.touches.length > 0) {
      const element = this.host.renderRoot.children[0];
      const {x, y, winX, winY} = this._getMousePos(
        element,
        element.offsetWidth,
        element.offsetHeight,
        e
      );

      this.movedX = e.movementX;
      this.movedY = e.movementY;
      this.x = x;
      this.y = y;
      this.winX = winX;
      this.winY = winY;
    }

    if (!this._hasInteracted) {
      // For first draw, make previous and next equal
      this._updateMouseCoords();
      this._hasInteracted = true;
    }
  }

  _updateMouseCoords() {
    this.px = this.x;
    this.py = this.y;
    this.pwinX = this.winX;
    this.pwinY = this.winY;
  }

  _getMousePos(element, w, h, evt) {
    if (evt && !evt.clientX) {
      // use touches if touch and not mouse
      if (evt.touches) {
        evt = evt.touches[0];
      } else if (evt.changedTouches) {
        evt = evt.changedTouches[0];
      }
    }

    const rect = element.getBoundingClientRect();
    const sx = element.scrollWidth / w || 1;
    const sy = element.scrollHeight / h || 1;

    return {
      x: (evt.clientX - rect.left) / sx,
      y: (evt.clientY - rect.top) / sy,
      winX: evt.clientX,
      winY: evt.clientY,
      id: evt.identifier,
    };
  }

  _setMouseButton(e) {
    if (e.button === 1) {
      this.button = 0;
    } else if (e.button === 2) {
      this.button = 1;
    } else {
      this.button = -1;
    }
  }
}
