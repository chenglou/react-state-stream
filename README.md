# React State Stream

React animation on steroid.

This is highly experimental. For a more stable and performant library, try [React Tween State](https://github.com/chenglou/react-tween-state).

Not providing a npm package for the moment. Actively looking for feedback since this might as well be the default React animation mechanism in the future.

## What This Library Solves
General animation API, including unmounting transition (and de-unmounting!). `npm install && npm run build` and open `index.html`. There are 3 demos (selectively comment out those in `index.jsx` to see each):

  1. Infinitely spinning child inside infinitely spinning parent.
  2. Normal tweening animation using third-party easing functions.
  3. Non-blocking unmounting and de-unmounting list.

## General Concept
Instead of one state, set all the states that will ever be, aka a state stream. This is akin to FRP but uses an ordinary `LazySeq<State>`. Also reminiscent of Flash's timeline.

A normal tween can simply be expressed as a map over a chunk of the lazy seq. Same for physics engine. Works even if the tween never stops (e.g. a physics engine where a menu item floats in mid air).

Unmounting is taken care of by storing a copy of `props.children` in the transition wrapper component's state stream, along with a `StyleObjects<childKey, Object>` for animation, most probably. Each frame (`componentWillUpdate`) it diffs the entering/exiting children. It then describes how the transition changes:

```js
tween = this.stream.take(100).map(state => update(state.config.childKey.height, easeOut(bla)))
rest = this.steam.drop(100)
  .map(state => update(state.config.childKey.height, 0))
  .map(state => update(state.children, blaOneLessChild))

this.stream = tween.concat(rest)
```

WIth this we can now do de-unmounting (ok frankly I have no idea why I'm so hooked up on this. It just feels conceptually right, you know?) by overriding the `map`s again.

## Mentality (i.e. How This Came to Be)
One important idea is that, while the render function stays a snapshot of props and (current) state, it's called on every frame, just like in game engines. Constantly lifting every state a-la FRP sounds tedious and it's practically hard to express; but modifying a lazy seq (with an array-like API) isn't. `setState(s)` becomes `setStateStream(InfiniteRepeat(s))`.

For unmounting, we really need to treat it as first-class state stream transformation rather than some hacky afterthought. The system needs to work well when an unmounting item takes infinite time to transition out and but doesn't block anything else.

When I said first-class, I mean that we need to realize that unmounting transition is not reserved for just animation. With this library (demo 3 specifically) we gain new ways of expressing some UIs:

  - Imagine a photo app where swiping left/right shows the prev/next picture. If we swipe and hold midway, there are two photos on the screen at that moment. With the transition wrapper, we don't have to take care of that logic in our main view! Picture 1 will infinitely stay in "unmounting" mode and picture 2, in "mounting" mode.
  - If we wrap the whole app in a transition wrapper, we can do portrait-landscape crossfade for free.

Thanks to this mentality (i.e. animation is really just a state stream), there are very little library-specific code here. Like, 40 lines (to change some existing React behaviors) + some general sequence helpers.

## Optimizations
This library is extremely underperformant for the moment, as I wanted to focus on the API. But there are huge perf boosts to be had. For one, currently the lazy seq doesn't cache (https://github.com/facebook/immutable-js/issues/263) so each `get` is linear time. Mori does and I might try it later. And I rAF `setState` each component so the leaf nodes get `log(n)` `setState`s per frame, lol.

In the future, an infinite lazy seq won't do, since every `map` operation on it continues to accumulate more functions to apply to the items once they're getting evaluated. Fortunately, instead of doing `InfiniteRepeat(state)`, we can do `RepeatOnce(state)`; if the system sees that there's only one item to take out of the stream, it stops taking it and thus stops the rendering. So `setState(s)` and `RepeatOnce(state)` are conceptually equivalent. Conveniently, this stops the functions accumulation until we restart a new stream based on this final state value.

Laziness is extremely important here. Same for persistent collections. I'm using [immutable-js](https://github.com/facebook/immutable-js), but as long as these aren't first-class in JS, we'll have to pay the extra cost of converting collections to JS, and vice-versa (unless we use persistent collection in React itself). This library probably runs much faster on ClojureScript right now if I had bothered. Now we sit and wait til lazy seqs and persistent collections become JS native in 20 years.
