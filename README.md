# weiqi.js [![Build Status](https://travis-ci.org/cjlarose/weiqi.js.svg?branch=master)](https://travis-ci.org/cjlarose/weiqi.js)

`weiqi.js` is an implementation of the board game [Go][1]. It provides
mechanisms for representing a board with black and white stones, as well as the
logic to actually play a game. The objects used in `weiqi.js` are
[persistent][2]--methods often return entirely new instances instead of
mutating internal state.

Persistence and structural sharing offer a memory-efficient way to represent multiple
states of the board simutaneously, a desirable trait for applications where
you'd like to explore the history of the game (such as for review) or to
explore possible future responses (such as for AI decision-making).

[1]: http://en.wikipedia.org/wiki/Go_%28game%29
[2]: http://en.wikipedia.org/wiki/Persistent_data_structure

The library is available as an [`npm` package][3], and can be used in the
browser with tools like [browserify][4].

[3]: https://www.npmjs.com/package/weiqi
[4]: http://browserify.org/

**Note: This library's API is still unstable. There will be breaking API
changes in future releases.**

[5]: http://semver.org/

## Playing a game

```javascript
var Weiqi = require('weiqi');
var game = Weiqi.createGame(9)            // creates a game with a 9 x 9 board
                .play(Weiqi.BLACK, [2,2]) // positions are 0-indexed. Black plays at the 3-3 point.
                .play(Weiqi.WHITE, [6,6]) // white plays at the 7-7 corner.
                .pass(Weiqi.BLACK)        // black passes
                .pass(Weiqi.WHITE);       // white passes
```

`Game` handle captures appropriately. It forbids the same player playing twice.
It enforces [positional superko][5]--at the end of any turn, the board cannot
be in a state in which it has been previously.

[5]: http://senseis.xmp.net/?Superko

```javascript
game.areaScore(7.5);  // compute area score given 7.5 komi
```

Getting [area score][6] (with a given value of komi) is supported by a `Game`. 

[6]: http://senseis.xmp.net/?Scoring
