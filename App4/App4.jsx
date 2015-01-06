/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('../stateStream');
var easingTypes = require('../easingTypes');
var algo = require('./algo');
var diff = require('./diff');

function toObj(children) {
  return React.Children.map(children, function(child) {
    return child;
  });
}

var ease = easingTypes.easeInOutQuad;

var Container = React.createClass({
  mixins: [stateStream.Mixin],
  getInitialStateStream: function() {
    var children = toObj(this.props.children);
    var configs = {};
    var i = 0;
    for (var key in children) {
      if (!children.hasOwnProperty(key)) {
        continue;
      }
      configs[key] = {
        left: 0,
        height: 60,
        opacity: 1,
        top: 60 * i,
      };
      i++;
    }

    return M.repeat(1, M.js_to_clj({
      children: children,
      configs: configs,
    }));
  },

  // TODO: show this: sometimes it's desirable not to have moves, as items
  // overlapping and moving to new positions might be disturbing. better just
  // remove and add somewhere else at the same time. This can be done without
  // special handling (not here at least) by incorporating the position into the
  // key. But what if we have 12 -> 21? We want 1 add/remove, and 2 move. But if
  // 2 has the key '2-1' then '2-0' it'll also get killed.

  // there might be a new insight here. maybe the whole diffing and state
  // children is already determinable through key assignment

  // TODO: abstract away this logic!

  // TODO: abc -> c will see d restart its transitioning out
  componentWillReceiveProps: function(nextProps) {
    var nextChildrenMap = toObj(nextProps.children);
    var currChildrenMap = toObj(this.props.children);
    var enters = diff(nextChildrenMap, currChildrenMap);
    var exits = diff(this.state.children, nextChildrenMap);

    var childrenKeys = algo(Object.keys(this.state.children), Object.keys(nextChildrenMap));
    var children = {};
    childrenKeys.forEach(function(key) {
      children[key] = nextChildrenMap[key] || this.state.children[key];
    }, this);

    var duration = 2700;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var newStream = stateStream.extendTo(frameCount + 1, this.stream);
    var finalTops = {};
    childrenKeys.forEach(function(key, i) {
      var config = initState.configs[key];
      if (exits.indexOf(key) > -1) {
        finalTops[key] = config.top;
      } else {
        finalTops[key] = Object.keys(nextChildrenMap).indexOf(key) * 60;
      }
    });

    childrenKeys.forEach(function(key, i) {
      var chunk;
      var restChunk;
      var finalTop = finalTops[key];
      // config might already exist if the component is still unmounting
      var config = initState.configs[key] || {
        left: 200,
        height: 0,
        opacity: 0,
        top: finalTop,
      };

      if (exits.indexOf(key) > -1) {
        chunk = M.map(function(stateI, i) {
          var ms = stateStream.toMs(i);

          return M.assoc_in(stateI, ['configs', key], M.hash_map(
            'left', ease(ms, config.left, 200, duration),
            'opacity', ease(ms, config.opacity, 0, duration),
            'height', ease(ms, config.height, 0, duration),
            'top', ease(ms, config.top, finalTop, duration)
          ));
        }, M.take(frameCount, newStream), M.range());

        restChunk = M.map(function(stateI) {
          return M.assoc(
            stateI,
            'children', M.js_to_clj(nextChildrenMap),
            'configs', M.dissoc(M.get(stateI, 'configs'), key)
          );
        }, M.drop(frameCount, newStream));

      } else if (enters.indexOf(key) > -1) {
        chunk = M.map(function(stateI, i) {
          var ms = stateStream.toMs(i);

          stateI = M.assoc_in(stateI, ['configs', key], M.hash_map(
            'left', ease(ms, config.left, 0, duration),
            'opacity', ease(ms, config.opacity, 1, duration),
            'height', ease(ms, config.height, 60, duration),
            'top', ease(ms, config.top, finalTop, duration)
          ));
          stateI = M.assoc(stateI, 'children', M.js_to_clj(children));

          return stateI;
        }, M.take(frameCount, newStream), M.range());

        restChunk = M.map(function(stateI) {
          stateI = M.assoc_in(stateI, ['configs', key], M.hash_map(
            'left', 0,
            'height', 60,
            'opacity', 1,
            'top', finalTop
          ));
          stateI = M.assoc(stateI, 'children', M.js_to_clj(nextChildrenMap));

          return stateI;
        }, M.drop(frameCount, newStream));
      } else {
        chunk = M.map(function(stateI, i) {
          var ms = stateStream.toMs(i);

          return M.assoc_in(
            stateI,
            ['configs', key, 'top'],
            ease(ms, config.top, finalTop, duration)
          );
        }, M.take(frameCount, newStream), M.range());

        restChunk = M.map(function(stateI) {
          return M.assoc_in(stateI, ['configs', key], M.hash_map(
            'left', 0,
            'height', 60,
            'opacity', 1,
            'top', finalTop
          ));
        }, M.drop(frameCount, newStream));
      }

      newStream = M.concat(chunk, restChunk);
    });

    this.setStateStream(newStream);
  },

  render: function() {
    var state = this.state;
    var children = [];
    for (var key in state.children) {
      if (!state.children.hasOwnProperty(key)) {
        continue;
      }
      var s = {
        left: state.configs[key].left,
        height: state.configs[key].height,
        opacity: state.configs[key].opacity,
        top: state.configs[key].top,
        position: 'absolute',
        overflow: 'hidden',
        WebkitUserSelect: 'none',
      };
      children.push(
        <div style={s} key={key}>{state.children[key]}</div>
      );
    }

    return <div style={{position: 'relative'}}>{children}</div>;
  }
});

// animation-unaware component
var App3 = React.createClass({
  getInitialState: function() {
    return {
      items: ['a', 'b', 'c', 'd'],
      // items: ['c'],
    };
  },

  handleClick: function(sequence) {
    this.setState({
      items: sequence.split(''),
    });
  },

  render: function() {
    var s = {
      width: 100,
      padding: 20,
      border: '1px solid gray',
      borderRadius: 3,
    };

    return (
      <div>
        <button onClick={this.handleClick.bind(null, 'abc')}>abc</button>
        <button onClick={this.handleClick.bind(null, 'c')}>c</button>
        <button onClick={this.handleClick.bind(null, 'ab')}>ab</button>
        <button onClick={this.handleClick.bind(null, 'ba')}>ba</button>

        <button onClick={this.handleClick.bind(null, 'bcd')}>1 bcd</button>
        <button onClick={this.handleClick.bind(null, 'cd')}>2 cd</button>
        <button onClick={this.handleClick.bind(null, 'bcd')}>3 bcd</button>
        <Container>
          {this.state.items.map(function(item) {
            return <div style={s} key={item}>{item}</div>;
          }, this)}
        </Container>
      </div>
    );
  }
});

module.exports = App3;
