var I = require('Immutable');

var fuck = 0;

function toRange(ms) {
  return I.Range(0, ms, 1000/60);
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
    var state = stream.first().toJS();
    this.stream = stream.rest();
    this.setState(state);
  },

  componentWillMount: function() {
    if (this.getInitialStateStream) {
      // first value taken by getInitialState below
      this.stream = this.getInitialStateStream().rest();
    } else {
      this.stream = I.Repeat(I.Map({}));
    }
  },

  getInitialState: function() {
    var s;
    if (this.getInitialStateStream) {
      s = this.getInitialStateStream().first().toJS();
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
      if (fuck++ > 9999) {
        throw 'asd';
      }

      var stateI = self.stream.first();
      self.stream = self.stream.rest();
      self.setState(stateI.toJS());

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
