import {LitElement, html, css} from 'lit';
import {Task} from '@lit-labs/task';

export class CoursePanel extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 400px;
      }
    `;
  }

  static get properties() {
    return {
      selected: {type: Object},
    };
  }

  _courses = [];

  _fetchCourses = new Task(this, async () => {
    const response = await fetch(`courses.csv`);
    const reader = response.body.getReader();

    let i = 0;
    let line = 0;
    let last = null;
    const c = '\n'.charCodeAt(0);
    const decoder = new TextDecoder();

    while (true) {
      const {value, done} = await reader.read();
      if (done) {
        break;
      }

      while (true) {
        const nextline = value.indexOf(c, i);
        if (nextline === -1) {
          last = value.slice(i);
          i = 0;
          break;
        }

        if (line) {
          let s = '';
          if (last) {
            s = decoder.decode(last);
            last = null;
          }
          s += decoder.decode(value.slice(i, nextline));
          // TODO: parse csv fields
          this._courses.push(s);
        }

        i = nextline + 1;
        ++line;
      }
    }
    return this._courses.length;
  });

  connectedCallback() {
    super.connectedCallback();
    this._fetchCourses.run();
  }

  render() {
    return html`<div>
      ${this._fetchCourses.render({
        pending: () => html`Loading courses info...`,
      })}
    </div>`;
  }
}

window.customElements.define('course-panel', CoursePanel);
