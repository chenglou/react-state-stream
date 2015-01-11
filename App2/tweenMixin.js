var stateStream = require('../stateStream');
var M = require('mori');

var tweenMixin = {
  getInitialState: function() {
    return {
      _contrib: {},
    };
  },
  // TODO: prolly doesn't have to be a mixin
  // TODO: better name
  mapState: function(stream, duration, cb) {
    var frameCount = stateStream.toFrameCount(duration);
    var newStream = stateStream.extendTo(frameCount, stream);

    var chunk = M.map(
      cb,
      M.take(frameCount, newStream),
      M.map(stateStream.toMs, M.range())
    );

    // TODO: don't force evaluate this
    var restChunk = M.map(
      M.identity,
      M.repeat(M.last(chunk)),
      M.drop(frameCount, newStream)
    );

    return M.concat(chunk, restChunk);
  },

  mapChunk: function(stream, duration, cb, asd) {
    var frameCount = stateStream.toFrameCount(duration);
    var newStream = stateStream.extendTo(frameCount, stream);

    var chunk = M.map(
      cb,
      M.take(frameCount, newStream),
      M.map(stateStream.toMs, M.range())
    );

    var restChunk = M.drop(frameCount, stream);
    return M.concat(chunk, restChunk);
  },

  // TODO: inappropriate name
  tweenState: function(stream, duration, path, config) {
    var frameCount = stateStream.toFrameCount(duration);
    var newStream = stateStream.extendTo(frameCount + 1, stream);

    var pathKey = path.join('|');
    var contribPath = ['_contrib', pathKey];

    newStream = M.map(function(stateI) {
      return M.assoc_in(
        stateI,
        path,
        config.endValue
      );
    }, newStream);

    var beginValue = config.beginValue == null ?
      M.get_in(M.first(stream), path) :
      config.beginValue;

    newStream = this.mapChunk(newStream, duration, function(stateI, ms) {
      var contrib = -config.endValue + config.easingFunction(
        ms,
        beginValue,
        config.endValue,
        duration
      );

      return M.assoc_in(
        stateI,
        contribPath,
        M.conj(M.get_in(stateI, contribPath, M.vector()), contrib)
      );
    }, true);

    return newStream;

    // easing: easingFunction,
    // // duration: timeInMilliseconds,
    // // delay: timeInMilliseconds,
    // beginValue: aNumber,
    // endValue: aNumber,
    // // onEnd: endCallback,
    // // stackBehavior: behaviorOption

  },

  getAdditiveValue: function(path) {
    var p = path.join('|');
    var stateVal = this.state;
    for (var i = 0; i < path.length; i++) {
      stateVal = stateVal[path[i]];
    }
    var contribs = this.state._contrib;
    if (!(contribs && contribs[p])) {
      // not been set, or already finished and removed
      // TODO: actually remove from _contrib
      return stateVal;
    }

    return contribs[p].reduce(function(a, x) {
      return a + x;
    }, stateVal);
  },
};

module.exports = tweenMixin;
