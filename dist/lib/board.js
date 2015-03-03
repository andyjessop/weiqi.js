"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.createBoard = createBoard;

var Immutable = _interopRequire(require("immutable"));

var Constants = _interopRequire(require("./constants"));

var Point = (function (_Immutable$Record) {
  function Point(i, j) {
    _classCallCheck(this, Point);

    _get(Object.getPrototypeOf(Point.prototype), "constructor", this).call(this, { i: i, j: j });
  }

  _inherits(Point, _Immutable$Record);

  return Point;
})(Immutable.Record({ i: 0, j: 0 }));

function inBounds(size, point) {
  return point.i >= 0 && point.i < size && point.j >= 0 && point.j < size;
}

function getStone(stones, coords) {
  return stones.get(coords, Constants.EMPTY);
}

function replaceStone(stones, coords, value) {
  return stones.set(coords, value);
}

var deltas = Immutable.List.of(new Point(-1, 0), new Point(0, 1), new Point(1, 0), new Point(0, -1));

/*
 * Given a board position, returns a list of [i,j] coordinates representing
 * orthagonally adjacent intersections
 */
function getAdjacentIntersections(size, coords) {
  var addPair = function (vec) {
    return new Point(vec.i + coords.i, vec.j + coords.j);
  };
  return deltas.map(addPair).filter(function (coord) {
    return inBounds(size, coord);
  });
}

function allPositions(size) {
  var range = Immutable.Range(0, size);
  return range.flatMap(function (i) {
    return range.map(function (j) {
      return new Point(i, j);
    });
  });
}

/*
 * Performs a breadth-first search about an (i,j) position to find recursively
 * orthagonally adjacent stones of the same color (stones with which it shares
 * liberties). Returns null for if there is no stone at the specified position,
 * otherwise returns an object with two keys: "liberties", specifying the
 * number of liberties the group has, and "stones", the list of [i,j]
 * coordinates of the group's members.
 */
function getGroup(stones, size, coords) {
  var color = getStone(stones, coords);

  function search(_x, _x2, _x3) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var visited = _x,
          queue = _x2,
          surrounding = _x3;
      stone = neighbors = undefined;

      if (queue.isEmpty()) {
        return { visited: visited, surrounding: surrounding };
      }var stone = queue.first();
      queue = queue.shift();

      if (visited.has(stone)) {
        _x = visited;
        _x2 = queue;
        _x3 = surrounding;
        _again = true;
        continue _function;
      }

      var neighbors = getAdjacentIntersections(size, stone);
      neighbors.forEach(function (n) {
        var state = getStone(stones, n);
        if (state == color) queue = queue.push(n);else surrounding = surrounding.set(n, state);
      });

      visited = visited.add(stone);
      _x = visited;
      _x2 = queue;
      _x3 = surrounding;
      _again = true;
      continue _function;
    }
  }

  var _search = search(Immutable.Set(), Immutable.List([coords]), Immutable.Map());

  var visited = _search.visited;
  var surrounding = _search.surrounding;

  var liberties = surrounding.filter(function (color) {
    return color == Constants.EMPTY;
  });

  return Immutable.Map({ liberties: liberties.size,
    stones: visited,
    surrounding: surrounding });
}

function createBoard(size, stones) {
  if (typeof size === "undefined" || size < 0) throw "Size must be an integer greater than zero";

  if (typeof stones === "undefined") stones = Immutable.Map();

  var Board = {

    getStone: function (coords) {
      return getStone(stones, new Point(coords[0], coords[1]));
    },

    toArray: function toArray() {
      return this.getIntersections().toJS();
    },

    getStones: function (color) {
      return stones.filter(function (stoneColor) {
        return stoneColor == color;
      }).keySeq().map(function (point) {
        return [point.i, point.j];
      }).toJS();
    },

    getSize: function () {
      return size;
    },

    getIntersections: function () {
      var range = Immutable.Range(0, size);
      return range.map(function (i) {
        return range.map(function (j) {
          return getStone(stones, new Point(i, j));
        });
      });
    },

    /*
     * Attempt to place a stone at (i,j).
     */
    play: function play(color, coords) {
      coords = new Point(coords[0], coords[1]);

      if (!inBounds(size, coords)) throw "Intersection out of bounds";

      if (getStone(stones, coords) != Constants.EMPTY) throw "Intersection occupied by existing stone";

      var newBoard = replaceStone(stones, coords, color);
      var neighbors = getAdjacentIntersections(size, coords);
      var neighborColors = Immutable.Map(neighbors.zipWith(function (n) {
        return [n, getStone(newBoard, n)];
      }));
      var opponentColor = function (stoneColor, coords) {
        return stoneColor != color && stoneColor != Constants.EMPTY;
      };
      var isDead = function (group) {
        return group.get("liberties") === 0;
      };
      var captured = neighborColors.filter(opponentColor).map(function (val, coord) {
        return getGroup(newBoard, size, coord);
      }).valueSeq().filter(isDead);

      // detect suicide
      var newGroup = getGroup(newBoard, size, coords);
      if (captured.isEmpty() && isDead(newGroup)) captured = Immutable.List([newGroup]);

      newBoard = captured.flatMap(function (g) {
        return g.get("stones");
      }).reduce(function (acc, stone) {
        return replaceStone(acc, stone, Constants.EMPTY);
      }, newBoard);

      return createBoard(size, newBoard);
    },

    areaScore: function areaScore() {
      var positions = allPositions(size);
      var visited = Immutable.Set();
      var score = {};
      score[Constants.BLACK] = 0;
      score[Constants.WHITE] = 0;

      positions.forEach(function (coords) {
        if (visited.has(coords)) return;

        var state = getStone(stones, coords);
        var group = getGroup(stones, size, coords);
        var groupStones = group.get("stones");
        var surroundingColors = group.get("surrounding").valueSeq().toSet();

        if (state == Constants.EMPTY) {
          if (surroundingColors.size === 1) score[surroundingColors.first()] += groupStones.size;
        } else {
          score[state] += groupStones.size;
        }

        visited = visited.union(groupStones);
      });

      return score;
    }
  };

  return Object.create(Board);
}

;
Object.defineProperty(exports, "__esModule", {
  value: true
});