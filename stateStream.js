var M = require('mori');

function toMs(frame) {
  return frame * 1000 / 60;
}

function toFrameCount(ms) {
  return ms * 60 / 1000;
}

function requestAnimationFrame2(f) {
  setTimeout(function() {
    f();
  }, 1000/60);
}

function onlyOneLeft(seq) {
  return M.count(M.take(2, seq)) === 1;
}

// when a stream has size 4 and you want to map a tween of size 10, you extend
// the stream to 10. This helper does it and fill it with the last value of the
// stream. If the stream's already longer than n then just return it
function extendTo(n, seq) {
  var s = M.take(n, seq);
  var length = M.count(s);
  if (length === n) {
    return seq;
  }
  // TODO: this force evaluates the stream. Change that
  return M.concat(s, M.repeat(n - length, M.last(s)));
}

// mori/cljs mapping over multiple collections stops at the end of the shortest.
// for mapping over stream it's very conveninent to map til the end of the
// longest
function mapAll() {
  // TODO: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
  var f = arguments[0];
  var colls = [].slice.call(arguments, 1);

  return M.lazy_seq(function() {
    var hasSomeItem = M.some(M.seq, colls);
    if (!hasSomeItem) {
      return;
    }
    return M.cons(
      M.apply(f, M.map(M.first, colls)),
      M.apply(mapAll, f, M.map(M.rest, colls))
    );
  });
}

var stateStreamMixin = {
  setStateStream: function(stream) {
    this.stream = stream;
    this.startRaf();
  },

  getInitialState: function() {
    // TOOD: need to merge mixins getInitialStateStream... bla
    var s;
    if (this.getInitialStateStream) {
      s = M.clj_to_js(M.first(this.getInitialStateStream()));
    } else {
      s = {};
    }

    return s;
  },

  componentWillMount: function() {
    if (this.getInitialStateStream) {
      this.stream = this.getInitialStateStream();
    } else {
      this.stream = M.repeat(1, M.hash_map());
    }
  },

  startRaf: function() {
    // current implementation of the mixin is basic and doesn't optimize for the
    // fact that if a parent and child both include the mixin, there'd be
    // useless child updates (since it really should just ride on parent's
    // update). That's ok for the purpose of the demo for now
    var self = this;
    if (self._rafing) {
      return;
    }
    self._rafing = true;

    requestAnimationFrame(function next() {
      if (onlyOneLeft(self.stream)) {
        // already evaluated stream[0]
        self._rafing = false;
        return;
      }
      self.stream = M.rest(self.stream);
      var stateI = M.first(self.stream); // check order here
      self.replaceState(M.clj_to_js(stateI));

      requestAnimationFrame(next);
    });
  },

  componentDidMount: function() {
    this.startRaf();
  },
};

var stateStream = {
  Mixin: stateStreamMixin,
  toMs: toMs,
  toFrameCount: toFrameCount,
  extendTo: extendTo,
  mapAll: mapAll,
};

module.exports = stateStream;
