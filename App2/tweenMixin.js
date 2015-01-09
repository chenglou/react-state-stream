var stateStream = require('../stateStream');
var M = require('mori');

var tweenMixin = {
  // TODO: prolly doesn't have to be a mixin
  // TODO: better name
  mapState: function(stream, duration, cb) {
    var frameCount = stateStream.toFrameCount(duration);
    var newStream = stateStream.extendTo(frameCount + 1, stream);

    var chunk = M.map(
      cb,
      M.take(frameCount, newStream),
      M.map(stateStream.toMs, M.range())
    );

    var restChunk = M.map(
      cb,
      M.drop(frameCount, newStream),
      M.map(stateStream.toMs, M.repeat(frameCount))
    );

    return M.concat(chunk, restChunk);
  },

  mapChunk: function(stream, duration, cb) {
    var frameCount = stateStream.toFrameCount(duration);
    var newStream = stateStream.extendTo(frameCount, stream);

    var chunk = M.map(
      cb,
      M.take(frameCount, newStream),
      M.map(stateStream.toMs, M.range())
    );

    var restChunk = M.drop(frameCount, stream);

    return M.concat(chunk, restChunk);
  }
};

module.exports = tweenMixin;
