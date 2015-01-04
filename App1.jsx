/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('./stateStream');

var Child = React.createClass({
  mixins: [stateStream.Mixin],

  getInitialStateStreamTick: function () {
    // note that we use this.props here, and because of laziless, we know it's
    // gonna be the very current value of props (when the item is evaluated).
    // This is abusing the behavior of laziness and likely not a good idea
    // (e.g. in clojure, lazy seqs are chunked 32 items at time rather than 1,
    // so this shortcut wouldn't work)
    return M.hash_map(
      // *3 to offset the parent rotation. Just some visual nit
      'deg',
      ((this.state && this.state.deg) || 0) + 2 * (this.props.turnLeft ? -1 : 3)
    );
  },

  getInitialStateStream: function() {
    return M.map(this.getInitialStateStreamTick, stateStream.toRange(999999));
  },

  render: function() {
    // turn right 3 times faster to offset parent turning left. Just visual nits
    var s = {
      border: '1px solid gray',
      borderRadius: '20px',
      display: 'inline-block',
      padding: 18,
      WebkitTransform: 'rotate(' + this.state.deg + 'deg)',
      transform: 'rotate(' + this.state.deg + 'deg)',
    };
    return (
      <div style={s}>
        asd
      </div>
    );
  }
});

if (module.makeHot) {
  Child = module.makeHot(Child);
}

var App1 = React.createClass({
  mixins: [stateStream.Mixin],

  getInitialStateStreamTick: function(a, i) {
    return M.hash_map(
      'deg', i * -2,
      'childTurnLeft', false
    );
  },

  getInitialStateStream: function() {
    return M.map(this.getInitialStateStreamTick, stateStream.toRange(999999), M.range());
  },

  handleClick: function() {
    // key part! Alter the stream

    // for an infinite stream this is just asking for memory leak, since each
    // modification lazily accumulates functions to apply when a stream item is
    // taken. This is just a trivial demo however. Realistically we'd stop the
    // stream to signal that for that point onward it's the same state value
    // every frame

    // note that we can't just initiate a new stream completely here; some state
    // transformation might be happening and we'd lose them
    var newTurn = !M.get(M.first(this.stream), 'childTurnLeft');
    var s = M.map(function(stateI) {
      return M.assoc(stateI, 'childTurnLeft', newTurn);
    }, this.stream);

    this.setStateStream(s);
  },

  render: function() {
    var s = {
      border: '1px solid gray',
      borderRadius: '30px',
      display: 'inline-block',
      padding: 30,
      WebkitTransform: 'rotate(' + this.state.deg + 'deg)',
      transform: 'rotate(' + this.state.deg + 'deg)',
      marginLeft: 100,
    };
    return (
      <div style={{height: 200}}>
        <button onClick={this.handleClick}>Click</button>
        <div style={s}>
          <Child turnLeft={this.state.childTurnLeft}></Child>
        </div>
      </div>
    );
  }
});

module.exports = App1;
