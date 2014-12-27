var React = require('react');
var _ = require('lodash');

var fuck = 0;

function playStreamFrame() {
  if (this.stream.length === 0) {
    return;
  }


  var state = this.stream.shift();
  this.setState(state);
}

function setStateStreamFunc(stream) {
  stream = _.clone(stream);
  var state = stream.shift();
  this.stream = stream;
  this.setState(state);
}

function toRange(ms) {
  return _.range(0, ms * 60 / 1000);
}

var setStateStream = {
  setStateStream: setStateStreamFunc,
  playStreamFrame: playStreamFrame,
  componentWillMount: function() {
    this.stream = [];
  },

  componentDidMount: function() {
    requestAnimationFrame(function next() {
      if (fuck++ > 999) {
        throw 'asd';
      }
      this.playStreamFrame();
      requestAnimationFrame(next.bind(this));
    }.bind(this));
  },
};

var Comp = React.createClass({
  mixins: [setStateStream],
  getInitialState: function() {
    return {
      left: 70
    };
  },

  componentDidMount: function() {
    var s = toRange(2000).map(function(n) {
      return {
        left: this.state.left + n,
      };
    }, this);
    this.setStateStream(s);
  },

  render: function() {
    var s = {
      border: '1px solid gray',
      width: 60,
      height: 50,
      position: 'absolute',
      left: this.state.left,
    };
    return (
      <div style={s}>
        asd
      </div>
    );
  }
});

var App = React.createClass({
  render: function() {
    return (
      <div>
        <Comp></Comp>
      </div>
    );
  }
});

React.render(<App />, document.getElementById('content'));
