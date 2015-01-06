'use strict';

var assert = require('assert');

function notIn(as, a) {
  return as.indexOf(a) === -1;
}
function head(a) {
  return a[0];
}
function tail(a) {
  return a.slice(1);
}

function orderImpl(a, b, res) {
  if (a.length === 0 || b.length === 0) {
    return res.concat(a, b);
  }

  if (head(a) === head(b)) {
    return orderImpl(tail(a), tail(b), res.concat(head(a)));
  }
  if (notIn(b, head(a))) {
    return orderImpl(tail(a), b, res.concat(head(a)));
  }
  return orderImpl(tail(a), b, res);
}

function order(a, b) {
  return orderImpl(a, b, []);
}

function testA(a, b, res) {
  assert.deepEqual(order(a.split(''), b.split('')), res.split(''));
}

testA('ø', '', 'ø');
testA('', 'ø', 'ø');
testA('∫ø', '∫', '∫ø');
testA('ø∫', '∫', 'ø∫');
testA('ø∫', '∫ø', '∫ø');
testA('åø∫', '∫ø', 'å∫ø');
testA('åø∫', 'åø®∫', 'åø®∫');
testA('åø∫', 'å∫', 'åø∫');
testA('åø∫', 'ø', 'åø∫'); // or å ∫ ø? no
testA('ø', 'åø∫', 'åø∫');
// at the end, or beginning
testA('åø∫', '¬', 'åø∫¬');
// can't fully change in place.
testA('åø∫', '∫¬ø', 'å∫¬ø');
testA('åø∫', '∫¬åø', '∫¬åø');
testA('åø∫', '¬å∫ø', '¬å∫ø'); // no choice
testA('åø∫', 'å¬ø', 'å∫¬ø'); // or å ¬ ∫ ø
testA('øå∫', '¬å∫', 'ø¬å∫');
testA('ø∫', '¬å∫', 'ø¬å∫'); // or å ∫ ø ¬
testA('ø∫', '¬å', 'ø∫¬å');
testA('∫ø', '¬å', '∫ø¬å');

// testB('ø', '', '');
// testB('', 'ø', '');
// testB('∫ø', '∫', '');
// testB('ø∫', '∫', '');
// testB('ø∫', '∫ø', 'm∫'); // or mø
// testB('åø∫', '∫ø', 'm∫');
// testB('åø∫', 'åø®∫', '');
// testB('åø∫', 'å∫', '');
// testB('åø∫', 'ø', '');
// testB('ø', 'åø∫', '');
// testB('åø∫', '¬', '');
// testB('åø∫', '∫¬ø', 'mø');
// testB('åø∫', '∫¬åø', 'm∫'); // not må,mø
// testB('åø∫', '¬å∫ø', 'mø');
// testB('åø∫', 'å¬ø', '');
// testB('øå∫', '¬å∫', '');
// testB('ø∫', '¬å∫', '');

module.exports = order;
