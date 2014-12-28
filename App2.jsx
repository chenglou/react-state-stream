/*global -React */
var React = require('react');
var I = require('Immutable');
var stateStream = require('./stateStream');
var easingTypes = require('./easingTypes');

var App2 = React.createClass({
  mixins: [stateStream.Mixin],
  getInitialStateStream: function() {
    return stateStream.toRange(999999).map(function(ms, i) {
      return I.fromJS({
        blockX: [50, 400],
        goingLeft: [false, true],
      });
    }).cacheResult();
    // force evaluate the whole seq. "The fuck are you doing cheng lou?" Sorry
    // but there's no gradual caching and I don't want linear time `first()`
    // every single time in handleClick
  },

  handleClick: function() {
    var duration = 1500;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var finalX = [
      initState.goingLeft[0] ? 50 : 300,
      initState.goingLeft[1] ? 100 : 400,
    ];
    var newGoingLeft = I.List([!initState.goingLeft[0], !initState.goingLeft[1]]);
    // the convention should be to always access this.state (rather than
    // this.stream) in render and always access this.stream elsewhere. Here we
    // break the convention a bit for simpler code (currently, stream head is
    // the next state, not the current one)
    var chunk = this.stream.take(frameCount).map(function(stateI, i) {
      var ms = stateStream.toMs(i);
      var newBlockX = I.List([
        easingTypes.easeInOutQuad(ms, initState.blockX[0], finalX[0], duration),
        easingTypes.easeOutBounce(ms, initState.blockX[1], finalX[1], duration),
      ]);

      return stateI
        .setIn(['blockX'], newBlockX)
        .setIn(['goingLeft'], newGoingLeft);
    }).cacheResult();

    var finalXI = I.List(finalX);
    var restChunk = this.stream.skip(frameCount).map(function(stateI) {
      return stateI
        .setIn(['blockX'], finalXI)
        .setIn(['goingLeft'], newGoingLeft);
    }); // can't cacheResult here bc the perf would be horrible

    this.setStateStream(chunk.concat(restChunk));
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
      top: 50,
      WebkitTransform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
      transform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
    };

    return (
      <div>
        <button onClick={this.handleClick}>Click</button>
        <div style={s1}></div>
        <div style={s2}></div>
      </div>
    );
  }
});

module.exports = App2;
