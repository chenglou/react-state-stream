var M = require('mori');

function toRange(ms) {
  return M.range(0, ms, 1000/60);
}

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

// when a stream has size 4 and you want to map a tween of size 10, you don't
// wanna manually extend the stream to 10. This helper does it and fill it with
// the last value of the stream
function take2(n, seq) {
  var s = M.take(n, seq);
  var length = M.count(s);
  if (length === n) {
    return s;
  }
  return M.concat(s, M.repeat(n - length, M.last(s)));
}

// we don't want to drop the last frame,
// or we'll end up losing the final state.
function drop2(n, seq) {
  var s = M.drop(n, seq);
  if (!M.is_empty(s)) {
    return s;
  }
  return M.repeat(1, M.last(seq));
}

var stateStreamMixin = {
  setStateStream: function(stream) {
    this.stream = stream;
    this.startRaf();
  },

  getInitialState: function() {
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
        // already evaluated it
        self._rafing = false;
        return;
      }
      self.stream = M.rest(self.stream);
      var stateI = M.first(self.stream); // check order here
      self.setState(M.clj_to_js(stateI));

      requestAnimationFrame(next);
    });
  },

  componentDidMount: function() {
    this.startRaf();
  },
};

var stateStream = {
  Mixin: stateStreamMixin,
  toRange: toRange,
  toMs: toMs,
  toFrameCount: toFrameCount,
  take2: take2,
  drop2: drop2
};

module.exports = stateStream;
