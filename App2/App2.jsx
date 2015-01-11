/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('../stateStream');
var easingTypes = require('../easingTypes');
var tweenMixin = require('./tweenMixin');

var ease = easingTypes.easeInOutQuad;

var App2 = React.createClass({
  mixins: [stateStream.Mixin, tweenMixin],
  getInitialStateStream: function() {
    return M.repeat(1, M.js_to_clj({
      blockX: [0, 0, 0],
      goingLeft: false,
    }));
  },

  handleClick: function() {
    var duration = 1000;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var start = initState.goingLeft ? 400 : 0;
    var dest = initState.goingLeft ? 0 : 400;

    var newStream = M.map(function(stateI) {
      return M.assoc(stateI, 'goingLeft', !initState.goingLeft);
    }, this.stream);

    newStream = this.mapState(newStream, duration, function(stateI, ms) {
      return M.assoc_in(
        stateI,
        ['blockX', 0],
        ease(ms, start, dest, duration)
      );
    });

    newStream = this.mapState(newStream, duration, function(stateI, ms) {
      return M.assoc_in(
        stateI,
        ['blockX', 1],
        ease(ms, initState.blockX[1], dest, duration)
      );
    });

    newStream = this.tweenState(newStream, duration, ['blockX', 2], {
      endValue: dest,
      easingFunction: ease,
    });

    this.setStateStream(newStream);
  },

  render: function() {
    var s1 = {
      border: '1px solid gray',
      borderRadius: '10px',
      display: 'inline-block',
      padding: 20,
      position: 'absolute',
      top: 10,
      WebkitTransform: 'translate3d(' + this.state.blockX[0] + 'px,0,0)',
      transform: 'translate3d(' + this.state.blockX[0] + 'px,0,0)',
    };
    var s2 = {
      border: '1px solid gray',
      borderRadius: '10px',
      display: 'inline-block',
      padding: 20,
      position: 'absolute',
      top: 60,
      WebkitTransform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
      transform: 'translate3d(' + this.state.blockX[1] + 'px,0,0)',
    };

    var val = this.getAdditiveValue(['blockX', 2]);

    var s3 = {
      border: '1px solid gray',
      borderRadius: '10px',
      display: 'inline-block',
      padding: 20,
      position: 'absolute',
      top: 110,
      WebkitTransform: 'translate3d(' + val + 'px,0,0)',
      transform: 'translate3d(' + val + 'px,0,0)',
    };

    return (
      <div style={{height: 180}}>
        <button onClick={this.handleClick}>Click</button>
        <div style={s1}></div>
        <div style={s2}></div>
        <div style={s3}></div>
      </div>
    );
  }
});

module.exports = App2;
