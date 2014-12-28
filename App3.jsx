/*global -React */
var React = require('react');
var I = require('Immutable');
var stateStream = require('./stateStream');
var easingTypes = require('./easingTypes');

function diff(a1, a2) {
  var o1 = React.Children.map(a1, function(child) {
    return child;
  });
  var o2 = React.Children.map(a2, function(child) {
    return child;
  });

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
    var children = React.Children.map(this.props.children, function(child) {
      return child;
    });
    var configs = {};
    for (var key in children) {
      if (!children.hasOwnProperty(key)) {
        continue;
      }
      configs[key] = {
        left: 0,
        opacity: 1,
      };
    }

    children = I.Map(children);
    configs = I.fromJS(configs);

    return stateStream.toRange(999999).map(function(ms, i) {
      return I.Map({
        configs: configs,
        children: children,
      });
    }, this);
  },

  componentWillUpdate: function(nextProps) {
    var enters = diff(nextProps.children, this.props.children);
    var exits = diff(this.props.children, nextProps.children);
    if (exits.length === 0 && enters.length === 0) {
      return;
    }

    // TODO: do enters too
    // TODO: handle more than 1 exit
    if (exits.length > 0) {
      var exitKey = exits[0];
      var duration = 700;
      var frameCount = stateStream.toFrameCount(duration);
      var initState = this.state;

      var chunk = this.stream.take(frameCount).map(function(stateI, i) {
        var newLeft = easingTypes.easeInOutQuad(
          stateStream.toMs(i),
          initState.configs[exitKey].left,
          -200,
          duration
        );
        var newOpacity = easingTypes.easeInOutQuad(
          stateStream.toMs(i),
          initState.configs[exitKey].opacity,
          0,
          duration
        );

        return stateI
          .updateIn(['configs', exitKey, 'left'], function() {return newLeft;})
          .updateIn(['configs', exitKey, 'opacity'], function() {return newOpacity;});
      }).cacheResult();

      var children = React.Children.map(nextProps.children, function(child) {
        return child;
      });
      children = I.Map(children);

      var restChunk = this.stream.skip(frameCount).map(function(stateI) {
        return stateI
          .removeIn(['configs', exitKey])
          .updateIn(['children'], function() {return children;});
      }); // can't cacheResult here bc the perf would be horrible

      this.setStateStream(chunk.concat(restChunk));
    }
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
        opacity: state.configs[key].opacity,
        position: 'relative',
      };
      children.push(
        <div style={s} key={key}>{state.children[key]}</div>
      );
    }
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
    items.splice(items.indexOf(item), 1);
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
