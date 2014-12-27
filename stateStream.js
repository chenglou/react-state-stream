var I = require('Immutable');

var fuck = 0;

function toRange(ms) {
  return I.Range(0, ms, 1000/60);
}

function toMs(frame) {
  return frame * 1000 / 60;
}

// function map2(arr1, arr2, f) {
//   var res = [];
//   for (var i = 0; i < Math.min(arr1.length, arr2.length); i++) {
//     var item1 = i < arr1.length ? arr1[i] : null;
//     var item2 = i < arr2.length ? arr2[i] : null;
//     res.push(f(item1, item2));
//   }

//   return res;
// }

function map2(extraArr, f) {
  var res = [];
  for (var i = 0; i < this.stream.length; i++) {
    res.push(f(_.cloneDeep(this.stream[i]), extraArr[i]));
  }

  var lastState = res[res.length - 1] || this.state;
  for (; i < extraArr.length; i++) {
    res.push(f(_.cloneDeep(lastState), extraArr[i]));
  }

  return res;
}

function requestAnimationFrame2(f) {
  setTimeout(function() {
    f();
  }, 1000/60);
}

var stateStreamMixin = {
  map2: map2,

  setStateStream: function(stream) {
    // set the state at the same time immediately. Don't wait til next frame
    // this is probably a desired behavior
    var state = stream.first().toObject();
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
      s = this.getInitialStateStream().first().toObject();
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
    requestAnimationFrame(function next() {
      if (fuck++ > 9999) {
        throw 'asd';
      }

      var stateI = this.stream.first();
      this.stream = this.stream.rest();
      this.setState(stateI.toObject());

      requestAnimationFrame(next.bind(this));
    }.bind(this));
  },
};

var stateStream = {
  Mixin: stateStreamMixin,
  toRange: toRange,
  toMs: toMs,
};

module.exports = stateStream;
