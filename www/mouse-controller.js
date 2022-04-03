export default class MouseController {
  host;
  element;

  onMouseUp() {
    this.host.requestUpdate();
  }

  constructor(host, element) {
    this.host = host;
    this.element = element || window;
    host.addController(this);
  }

  hostConnected() {
    this.element.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  hostDisconnected() {
    this.element.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }
}
