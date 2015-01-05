/*global -React */
var React = require('react');
var M = require('mori');
var stateStream = require('./stateStream');
var easingTypes = require('./easingTypes');
var ReactInputSelection = require('react/lib/ReactInputSelection');

function toObj(children) {
  return React.Children.map(children, function(child) {
    return child;
  });
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
        top: 0,
        opacity: 1
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
    var duration = 2500;
    var frameCount = stateStream.toFrameCount(duration);
    var initState = this.state;
    var newStream = this.stream;

    if (exits.length > 0) {

      var chunk = M.map(function(stateI, i) {
        exits.forEach(function(exitKey) {
          var ms = stateStream.toMs(i);
          var config = initState.configs[exitKey];

          stateI = M.assoc_in(stateI, ['configs', exitKey], M.hash_map(
            'top', easingTypes.easeInOutQuad(ms, config.top, -200, duration),
            'opacity', easingTypes.easeInOutQuad(ms, config.opacity, 0, duration)
          ));
        });

        return stateI;
      }, stateStream.take2(frameCount, newStream), M.range());

      var restChunk = M.map(function(stateI) {
        exits.forEach(function(exitKey) {
          stateI = M.assoc(
            stateI,
            'children', children,
            'configs', M.dissoc(M.get(stateI, 'configs'), exitKey)
          );
        });

        return stateI;
      }, stateStream.drop2(frameCount, newStream)); // can't cacheResult here bc the perf would be horrible

      newStream = M.concat(chunk, restChunk);
    }

    if (enters.length > 0) {
      var chunk2 = M.map(function(stateI, i) {
        enters.forEach(function(enterKey) {
          var ms = stateStream.toMs(i);
          var config = initState.configs[enterKey];

          stateI = M.assoc_in(stateI, ['configs', enterKey], M.hash_map(
            'top', easingTypes.easeInOutQuad(ms, config ? config.top : -200, 0, duration),
            'opacity', easingTypes.easeInOutQuad(ms, config ? config.opacity : 0, 1, duration)
          ));
          stateI = M.assoc(stateI, 'children', children);
        });

        return stateI;
      }, stateStream.take2(frameCount, newStream), M.range());

      var restChunk2 = M.map(function(stateI) {
        enters.forEach(function(enterKey) {
          stateI = M.assoc_in(stateI, ['configs', enterKey], M.hash_map(
            'top', 0,
            'opacity', 1
          ));
          stateI = M.assoc(stateI, 'children', children);
        });

        return stateI;
      }, stateStream.drop2(frameCount, newStream));

      newStream = M.concat(chunk2, restChunk2);
    }

    this.setStateStream(newStream);
  },

  componentDidUpdate: function (prevProps, prevState) {
    var o1 = toObj(this.state.children),
        o2 = toObj(prevState.children);

    if (diff(o1, o2).length || diff(o2, o1).length) {
      this.props.onUpdate();
    }
  },

  render: function() {
    var state = this.state;

    var children = state.children.map(function (kv) {
      var key = kv.key;
      var child = kv.value;
      var s = {
        top: state.configs[key].top,
        opacity: state.configs[key].opacity,
        position: 'relative',
        overflow: 'hidden',
        WebkitUserSelect: 'none',
      };
      return <span style={s} key={key}>{child}</span>;
    });

    return (
      <div>
        {children}
      </div>
    );
  }
});

var nextUuid = 0;
function toIndexedChars(s) {
  return s.split('').map(function (char) {
    return {
      uuid: nextUuid++,
      char: char
    };
  });
}

// notice that this component is ignorant of both immutable-js and the animation
var App4 = React.createClass({
  getInitialState: function () {
    return {
      chars: toIndexedChars('Click on me and type something')
    };
  },

  handleKeyDown: function (e) {
    // for now, only handle backspace
    if (e.keyCode !== 8) {
      return;
    }

    e.preventDefault();

    var chars = this.state.chars;
    var selection = this.getSelection();
    var from = Math.min(selection.start, selection.end);
    var to = Math.max(selection.start, selection.end);

    if (to > from) {
      chars.splice(from, to - from);
      this.setSelection({ start: from });
    } else if (from > 0) {
      chars.splice(from - 1, 1);
      this.setSelection({ start: from - 1 });
    }

    this.setState({
      chars: chars
    });
  },

  handleKeyPress: function (e) {
    e.preventDefault();

    var chars = this.state.chars;
    var selection = this.getSelection();
    var from = Math.min(selection.start, selection.end);
    var to = Math.max(selection.start, selection.end);

    chars.splice(from, to - from, toIndexedChars(String.fromCharCode(e.charCode))[0]);

    this.setSelection({
      start: from + 1
    });

    this.setState({
      chars: chars
    });
  },

  getSelection: function() {
    return this._pendingSelection || ReactInputSelection.getSelection(this.getDOMNode());
  },

  setSelection: function(selection) {
    if (typeof selection.end === 'undefined') {
      selection.end = selection.start;
    }

    this._pendingSelection = selection;
  },

  flushPendingSelection: function () {
    if (this._pendingSelection) {
      ReactInputSelection.setSelection(this.getDOMNode(), this._pendingSelection);
      delete this._pendingSelection;
    }
  },

  handleContainerUpdate: function() {
    this.flushPendingSelection();
  },

  render: function() {
    return (
      <div style={{ marginTop: 20 }}
           contentEditable
           onKeyPress={this.handleKeyPress}
           onKeyDown={this.handleKeyDown}>
        <Container onUpdate={this.handleContainerUpdate}>
          {this.state.chars.map(function (char) {
            return (
              <span key={char.uuid}
                    style={{whiteSpace: 'pre'}}>
                {char.char}
              </span>
            );
          })}
        </Container>
      </div>
    );
  }
});

module.exports = App4;
