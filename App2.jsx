/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('./stateStream');
var easingTypes = require('./easingTypes');

var App2 = React.createClass({
  mixins: [stateStream.Mixin],

  getInitialStateStreamTick: function () {
    return M.js_to_clj({
      blockX: [50, 400],
      goingLeft: [false, true],
    });
  },

  getInitialStateStream: function() {
    return M.map(this.getInitialStateStreamTick, stateStream.toRange(999999));
  },

  handleClick: function() {
    var duration = 1500;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var finalX = [
      initState.goingLeft[0] ? 50 : 300,
      initState.goingLeft[1] ? 100 : 400,
    ];
    var newGoingLeft = M.vector(!initState.goingLeft[0], !initState.goingLeft[1]);
    // the convention should be to always access this.state (rather than
    // this.stream) in render and always access this.stream elsewhere. Here we
    // break the convention a bit for simpler code (currently, stream head is
    // the next state, not the current one)
    var chunk = M.map(function(stateI, i) {
      var ms = stateStream.toMs(i);
      var newBlockX = M.vector(
        easingTypes.easeInOutQuad(ms, initState.blockX[0], finalX[0], duration),
        easingTypes.easeOutBounce(ms, initState.blockX[1], finalX[1], duration)
      );

      return M.assoc(stateI, 'blockX', newBlockX, 'goingLeft', newGoingLeft);
    }, M.take(frameCount, this.stream), M.range());

    var finalXI = M.js_to_clj(finalX);
    var restChunk = M.map(function(stateI) {
      return M.assoc(stateI, 'blockX', finalXI, 'goingLeft', newGoingLeft);
    }, M.drop(frameCount, this.stream));

    this.setStateStream(M.concat(chunk, restChunk));
  },

  render: function() {
    var s1 = {
      border: '1px solid gray',
      borderRadius: '10px',
      display: 'inline-block',
      padding: 20,
      position: 'relative',
      top: 10,
      WebkitTransform: 'translate3d(' + this.state.blockX[0] + 'px,0,0)',
      transform: 'translate3d(' + this.state.blockX[0] + 'px,0,0)',
    };
    var s2 = {
      border: '1px solid gray',
      borderRadius: '10px',
      display: 'inline-block',
      padding: 20,
      position: 'relative',
      top: 60,
      WebkitTransform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
      transform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
    };

    return (
      <div style={{height: 120}}>
        <button onClick={this.handleClick}>Click</button>
        <div style={s1}></div>
        <div style={s2}></div>
      </div>
    );
  }
});

module.exports = App2;
