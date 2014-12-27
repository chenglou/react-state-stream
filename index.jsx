var React = require('react');
var _ = require('lodash');

var easingTypes = require('./easingTypes');

var fuck = 0;

function toRange(ms) {
  return _.range(0, ms * 60 / 1000);
}

function toMs(frame) {
  return frame * 1000 / 60;
}

function map2(arr1, arr2, f) {
  var res = [];
  for (var i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    var item1 = i < arr1.length ? arr1[i] : null;
    var item2 = i < arr2.length ? arr2[i] : null;
    res.push(f(item1, item2));
  }

  return res;
}

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

var setStateStream = {
  setStateStream: setStateStreamFunc,
  playStreamFrame: playStreamFrame,

  componentWillMount: function() {
    this.stream = (this.getInitialStateStream && this.getInitialStateStream()) || [];
  },

  getInitialState: function() {
    return (this.getInitialStateStream && this.getInitialStateStream()[0]) || {};
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

var Block = React.createClass({
  render: function() {
    var s = {
      border: '1px solid gray',
      width: 60,
      height: 50,
      position: 'relative',
    };

    var style = _.merge(s, this.props.style);

    return <div {...this.props} style={style}>asd</div>;
  }
});

var Comp = React.createClass({
  mixins: [setStateStream],
  getInitialStateStream: function() {
    return [{
      left: [50, 80, 100],
    }];
  },

  handleClick: function(num) {
    // this is needed for laziness. ref to stream[0] in lazy map is resolves to
    // the wrong stream head
    var initState = this.state;
    var r = toRange(1000);
    var newStream = map2(this.stream, r, function(state, n) {
      var newState = _.cloneDeep(state);
      newState.left[num] = easingTypes.easeOutBounce(
        toMs(n),
        initState.left[num],
        initState.left[num] + 200,
        1000
      );

      return newState;
    });

    var finalState = newStream[newStream.length - 1] || initState;
    var moreStream = _.drop(r, newStream.length).map(function(n) {
      var state = _.cloneDeep(finalState);
      state.left[num] = easingTypes.easeOutBounce(
        toMs(n),
        initState.left[num],
        initState.left[num] + 200,
        1000
      );

      return state;
    });

    this.setStateStream(newStream.concat(moreStream));
  },

  render: function() {
    // TODO: don't let render access the whole stream for now. render stays a
    // snapshot ignorant of state history
    var state = this.state;
    var s1 = {left: state.left[0]};
    var s2 = {left: state.left[1]};

    return (
      <div>
        <button onClick={this.handleClick.bind(null, 0)}>click 0</button>
        <button onClick={this.handleClick.bind(null, 1)}>click 1</button>
        <Block style={s1}></Block>
        <Block style={s2}></Block>
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
