import MouseController from './mouse-controller';

class Node {
  left = null;
  right = null;

  constructor(attrs, dimension, parent) {
    this.attrs = attrs;
    this.dimension = dimension;
    this.parent = parent;
  }

  get isLeaf() {
    return this.left === null && this.right === null;
  }
}

export default class StageController extends MouseController {
  _root;
  _maxDistance = 0;

  selected = [];
  dimensions = ['x', 'y'];
  distance(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  }

  onMouseUp(event) {
    const {offsetX: x, offsetY: y} = event;
    this.selected = this.nearest({x, y}, 4, this._maxDistance);
    console.log(this.selected);
    super.onMouseUp(event);
  }

  set shapes(v) {
    let d = 0;
    v.forEach((shape) => {
      if (shape.radius !== undefined && shape.radius > d) {
        d = shape.radius;
      }
    });

    const a = {};
    const b = {};
    for (const i of this.dimensions) {
      a[i] = 0;
      b[i] = d;
    }

    this._maxDistance = this.distance(a, b);
    this._root = this._build(v, 0, null);
  }

  nearest(point, maxSize, maxDistance) {
    if (!this._root || maxSize < 1 || maxDistance <= 0) {
      return [];
    }

    const maxHeap = [];
    this._search(point, this._root, maxSize, maxDistance, maxHeap);
    return maxHeap;
  }

  _search(point, node, maxSize, maxDistance, maxHeap) {
    const d = this.dimensions[node.dimension];
    const v = point[d] - node.attrs[d];
    const child = v < 0 ? node.left : node.right;

    if (child !== null) {
      this._search(point, child, maxSize, maxDistance, maxHeap);
    }

    const metric = this.distance(point, node.attrs);
    if (metric <= maxDistance) {
      if (maxHeap.length < maxSize) {
        // push
        let i = maxHeap.push([metric, node]) - 1;
        while (i > 0) {
          const p = Math.floor((i - 1) / 2);
          if (maxHeap[p][0] > metric) {
            break;
          }
          // bubble-up
          [maxHeap[i], maxHeap[p]] = [maxHeap[p], maxHeap[i]];
          i = p;
        }
      } else if (maxHeap[0][0] > metric) {
        // replace
        maxHeap[0] = [metric, node];
        let i = 0;

        while (true) {
          const l = 2 * i + 1;
          const r = 2 * i + 2;

          let max = i;
          if (l < maxHeap.length && maxHeap[l][0] > maxHeap[max][0]) {
            max = l;
          }
          if (r < maxHeap.length && maxHeap[r][0] > maxHeap[max][0]) {
            max = r;
          }
          if (i === max) {
            break;
          }

          // down-heap
          [maxHeap[i], maxHeap[max]] = [maxHeap[max], maxHeap[i]];
          i = max;
        }
      }
    }

    // check the opposite side
    if (Math.abs(v) < maxDistance) {
      const opposite = v < 0 ? node.right : node.left;
      if (opposite !== null) {
        this._search(point, opposite, maxSize, maxDistance, maxHeap);
      }
    }
  }

  _build(points, depth, parent) {
    const dim = depth % this.dimensions.length;

    if (points.length === 0) {
      return null;
    }

    if (points.length === 1) {
      return new Node(points[0], dim, parent);
    }

    // can be optimized by partial sorting algorithm, e.g. std::nth_element in C++
    points.sort((a, b) => {
      return a[this.dimensions[dim]] - b[this.dimensions[dim]];
    });

    const median = Math.floor(points.length / 2);
    const node = new Node(points[median], dim, parent);
    node.left = this._build(points.slice(0, median), depth + 1, node);
    node.right = this._build(points.slice(median + 1), depth + 1, node);

    return node;
  }
}
