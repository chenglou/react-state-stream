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

var stateStreamMixin = {
  setStateStream: function(stream) {
    // set the state at the same time immediately. Don't wait til next frame
    // this is probably a desired behavior
    var state = M.clj_to_js(M.first(stream));
    this.stream = M.rest(stream);
    this.setState(state);
  },

  componentWillMount: function() {
    if (this.getInitialStateStream) {
      // first value taken by getInitialState below
      this.stream = M.rest(this.getInitialStateStream());
    } else {
      this.stream = M.repeat(M.hash_map());
    }
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

  componentDidMount: function() {
    // current implementation of the mixin is basic and doesn't optimize for the
    // fact that if a parent and child both include the mixin, there'd be
    // useless child updates (since it really should just ride on parent's
    // update). That's ok for the purpose of the demo for now
    var self = this;
    requestAnimationFrame(function next() {
      var stateI = M.first(self.stream);
      self.stream = M.rest(self.stream);
      self.setState(M.clj_to_js(stateI));

      requestAnimationFrame(next);
    });
  },
};

var stateStream = {
  Mixin: stateStreamMixin,
  toRange: toRange,
  toMs: toMs,
  toFrameCount: toFrameCount,
};

module.exports = stateStream;
