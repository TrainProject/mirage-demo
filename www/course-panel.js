import {LitElement, html, css} from 'lit';
import {map} from 'lit/directives/map.js';
import {Task} from '@lit-labs/task';

class CSVParser {
  static async parse(stream) {
    const reader = stream.getReader();

    let i = 0;
    let lines = 0;
    let quotes = 0;
    let local_offset = 0;
    let global_offset = 0;
    const commas = [];
    const chunks = [];
    const distribution = [];

    while (true) {
      const {value, done} = await reader.read();
      if (done) {
        break;
      }
      distribution.push(
        value.byteLength +
          (distribution.length ? distribution[distribution.length - 1] : 0)
      );

      chunks.push(value);
      while (true) {
        let j = i;

        // find LF outside double quotes
        while (j < value.byteLength && (value[j] !== 0x0a || quotes & 1)) {
          ++global_offset;
          if (value[j] === 0x22) {
            ++quotes;
          } else if (value[j] == 0x2c && !(quotes & 1)) {
            commas.push(j - i + local_offset);
          }
          ++j;
        }

        if (j === value.byteLength) {
          // going to be continued in next chunk
          local_offset += value.byteLength - i;
          i = 0;
          break;
        }

        // skip LF
        i = j + 1;
        ++global_offset;
        local_offset = 0;
        quotes = 0;
        ++lines;
        commas.push(global_offset);
      }
    }

    return {lines, commas, chunks, distribution};
  }

  constructor(configuration) {
    this.configuration = configuration;
    this.columns = configuration.commas.length / configuration.lines;
    this.decoder = new TextDecoder();
  }

  _indexOfChunk(i) {
    const distribution = this.configuration.distribution;
    let first = 0;
    let last = distribution.length - 1;

    while (first < last) {
      const middle = first + Math.floor((last - first) / 2);
      if (distribution[middle] < i) {
        first = middle + 1;
      } else {
        last = middle;
      }
    }

    if (first > last || i >= distribution[first]) {
      return -1;
    }
    return first;
  }

  _subarray(start, end) {
    if (start >= end) {
      return new Uint8Array();
    }

    const i = this._indexOfChunk(start);
    if (i === -1) {
      throw new Error(`Invalid start index: ${start}`);
    }

    const j = this._indexOfChunk(end - 1);
    if (j === -1) {
      throw new Error(`Invalid end index: ${end}`);
    }

    const n = end - start;
    const {chunks, distribution} = this.configuration;
    const iChunk = chunks[i];
    const iOffset = i === 0 ? start : start - distribution[i - 1];

    if (i === j) {
      return iChunk.subarray(iOffset, iOffset + n);
    }

    const buffer = new ArrayBuffer(n);
    const output = new Uint8Array(buffer);
    output.set(iChunk.subarray(iOffset));
    let offset = iChunk.byteLength - iOffset;
    for (let k = i + 1; k < j; ++k) {
      output.set(chunks[k], offset);
      offset += chunks[k].byteLength;
    }

    output.set(
      chunks[j].subarray(0, j === 0 ? end : end - distribution[j - 1]),
      offset
    );
    return output;
  }

  _field(start, end, removeCRLF = false) {
    let array = this._subarray(start, end);

    if (removeCRLF && array.byteLength) {
      // remove the ending CRLF
      array = array.subarray(
        0,
        array.byteLength - (array.at(-2) === 0x0d ? 2 : 1)
      );
    }

    if (array.byteLength && array.at(0) === 0x22 && array.at(-1) === 0x22) {
      array = array.subarray(1, array.byteLength - 1);
    }
    return array;
  }

  at(row, column) {
    const index = row * this.columns;
    const commas = this.configuration.commas.slice(
      row * this.columns,
      index + this.columns
    );
    if (!commas.length) {
      return;
    }

    const offset = index ? this.configuration.commas[index - 1] : 0;
    commas[commas.length - 1] -= offset;

    if (!isNaN(column)) {
      const start = offset + (column === 0 ? 0 : commas[column - 1] + 1);
      const end = offset + commas[column];
      return this._field(start, end, column + 1 === this.columns);
    }

    const output = [];
    let start = offset;
    for (const j of commas) {
      const end = offset + j;
      const field = this._field(
        start,
        end,
        output.length + 1 === commas.length
      );
      output.push(field);
      start = end + 1;
    }
    return output;
  }

  indexOf(i) {
    return this.at(i).map((field) => this.decoder.decode(field));
  }
}

class CoursePool {
  static async parseCSV(stream) {
    return CSVParser.parse(stream);
  }

  static _lexicographicalCompare(a, b) {
    const n = Math.min(a.byteLength, b.byteLength);
    for (let i = 0; i < n; ++i) {
      const d = a[i] - b[i];
      if (d !== 0) {
        return d;
      }
    }
    return a.byteLength - b.byteLength;
  }

  constructor(configuration) {
    this.csv = new CSVParser(configuration);
    this.header = this.csv.indexOf(0);
    this.encoder = new TextEncoder();
  }

  indexOf(i, toDict) {
    const value = this.csv.indexOf(i + 1);
    if (!toDict) {
      return value;
    }

    const dict = {};
    for (let i = 0; i < value.length; ++i) {
      dict[this.header[i]] = value[i];
    }
    return dict;
  }

  find(id, toDict) {
    const targetId = this.encoder.encode(id);
    let first = 1;
    let last = this.csv.configuration.lines;

    while (first < last) {
      const middle = first + Math.floor((last - first) / 2);
      const middleId = this.csv.at(middle, 0);
      const v = CoursePool._lexicographicalCompare(targetId, middleId);
      if (v === 0) {
        return this.indexOf(middle - 1, toDict);
      }

      if (v < 0) {
        last = middle;
      } else {
        first = middle + 1;
      }
    }
  }

  get size() {
    return this.csv.configuration.lines - 1;
  }
}

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

  _fetchCourses = new Task(this, async () => {
    const response = await fetch(`courses.csv`);
    const configuration = await CoursePool.parseCSV(response.body);
    return new CoursePool(configuration);
  });

  connectedCallback() {
    super.connectedCallback();
    this._fetchCourses.run();
  }

  renderSelected(coursePool) {
    if (!this.selected?.size) {
      return;
    }

    return html`
      <table>
        <tr>
          ${coursePool.header.map((item) => html`<th>${item}</th>`)}
        </tr>
        ${map(
          this.selected.keys(),
          (index) =>
            html`<tr>
              ${coursePool.indexOf(index).map((item) => html`<td>${item}</td>`)}
            </tr>`
        )}
      </table>
    `;
  }

  render() {
    return html`<div>
      ${this._fetchCourses.render({
        pending: () => html`Loading courses info...`,
        complete: (v) => this.renderSelected(v),
      })}
    </div>`;
  }
}

window.customElements.define('course-panel', CoursePanel);
