/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('./stateStream');
var easingTypes = require('./easingTypes');

function toObj(children) {
  return React.Children.map(children, function(child) {
    return child;
  });
}

function toKeyValueList(obj) {
  var arr = [];

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      arr.push({
        key: key,
        value: obj[key]
      });
    }
  }

  return arr;
}

function diff(o1, o2) {
  var res = [];
  for (var key in o1) {
    if (!o1.hasOwnProperty(key)) {
      continue;
    }
    if (!o2.hasOwnProperty(key)) {
      res.push(key);
    }
  }

  return res;
}

var Container = React.createClass({
  mixins: [stateStream.Mixin],
  getInitialStateStream: function() {
    var children = toObj(this.props.children);
    var configs = {};
    for (var key in children) {
      if (!children.hasOwnProperty(key)) {
        continue;
      }
      configs[key] = {
        left: 0,
        height: 60,
        opacity: 1,
      };
    }

    return M.repeat(1, M.js_to_clj({
      children: toKeyValueList(children),
      configs: configs,
    }));
  },

  componentWillUpdate: function(nextProps) {
    var o1 = toObj(nextProps.children);
    var o2 = toObj(this.props.children);
    var enters = diff(o1, o2);
    var exits = diff(o2, o1);

    if (exits.length === 0 && enters.length === 0) {
      return;
    }

    var children = M.js_to_clj(toKeyValueList(o1));
    var duration = 700;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var newStream = stateStream.extendTo(frameCount + 1, this.stream);

    if (exits.length > 0) {

      var chunk = M.map(function(stateI, i) {
        exits.forEach(function(exitKey) {
          var ms = stateStream.toMs(i);
          var config = initState.configs[exitKey];

          stateI = M.assoc_in(stateI, ['configs', exitKey], M.hash_map(
            'left', easingTypes.easeInOutQuad(ms, config.left, -200, duration),
            'opacity', easingTypes.easeInOutQuad(ms, config.opacity, 0, duration),
            'height', easingTypes.easeInOutQuad(ms, config.height, 0, duration)
          ));
        });

        return stateI;
      }, M.take(frameCount, newStream), M.range());

      var restChunk = M.map(function(stateI) {
        exits.forEach(function(exitKey) {
          stateI = M.assoc(
            stateI,
            'children', children,
            'configs', M.dissoc(M.get(stateI, 'configs'), exitKey)
          );
        });

        return stateI;
      }, M.drop(frameCount, newStream));

      newStream = M.concat(chunk, restChunk);
    }

    if (enters.length > 0) {
      var chunk2 = M.map(function(stateI, i) {
        enters.forEach(function(enterKey) {
          var ms = stateStream.toMs(i);
          var config = initState.configs[enterKey];

          stateI = M.assoc_in(stateI, ['configs', enterKey], M.hash_map(
            'left', easingTypes.easeInOutQuad(ms, config.left, 0, duration),
            'opacity', easingTypes.easeInOutQuad(ms, config.opacity, 1, duration),
            'height', easingTypes.easeInOutQuad(ms, config.height, 60, duration)
          ));
          stateI = M.assoc(stateI, 'children', children);
        });

        return stateI;
      }, M.take(frameCount, newStream), M.range());

      var restChunk2 = M.map(function(stateI) {
        enters.forEach(function(enterKey) {
          stateI = M.assoc_in(stateI, ['configs', enterKey], M.hash_map(
            'left', 0,
            'height', 60,
            'opacity', 1
          ));
          stateI = M.assoc(stateI, 'children', children);
        });

        return stateI;
      }, M.drop(frameCount, newStream));

      newStream = M.concat(chunk2, restChunk2);
    }

    this.setStateStream(newStream);
  },

  render: function() {
    var state = this.state;
    var children = state.children.map(function (kv) {
      var key = kv.key;
      var child = kv.value;
      var s = {
        left: state.configs[key].left,
        height: state.configs[key].height,
        opacity: state.configs[key].opacity,
        position: 'relative',
        overflow: 'hidden',
        WebkitUserSelect: 'none',
      };

      return <div style={s} key={key}>{child}</div>;
    });

    return (
      <div>
        {children}
      </div>
    );
  }
});

// notice that this component is ignorant of both immutable-js and the animation
var App3 = React.createClass({
  getInitialState: function() {
    return {
      items: ['a', 'b', 'c', 'd'],
    };
  },

  handleClick: function(item) {
    var items = this.state.items;
    var idx = items.indexOf(item);
    if (idx === -1) {
      // might not find the clicked item because it's transitioning out and
      // doesn't technically exist here in the parent anymore. Make it
      // transition back (BEAT THAT)
      items.push(item);
      items.sort();
    } else {
      items.splice(idx, 1);
    }
    this.setState({
      items: items,
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
        Click to remove. Double click to un-remove (!)
        <Container>
          {this.state.items.map(function(item) {
            return (
              <div
                style={s}
                key={item}
                onClick={this.handleClick.bind(null, item)}>
                {item}
              </div>
            );
          }, this)}
        </Container>
      </div>
    );
  }
});

module.exports = App3;
