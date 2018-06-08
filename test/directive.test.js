const assert = require( './assert' )

test.only( 'r-class', () => {
  assert(
  `<div class="static" r-class={{ 
    'active': a === 1,
    "active1": index 
    }}>foo</div>`,
  `<view class="_div static {{[a === 1 ? 'active' : '', index ? 'active1' : '']}}">foo</view>`
)
} )

test( 'r-hide', () => {
  assert(
    `<div r-hide="{ a === 1 }">foo</div>`,
    `<view class="_div" hidden="{{ a === 1 }}">foo</view>`
  )
} )

test( 'r-hide with whitespace', () => {
  assert(
    `<div r-hide="{ a === 1 }  ">foo</div>`,
    `<view class="_div" hidden="{{ a === 1 }}">foo</view>`
  )
} )

test( 'r-model', () => {
  assert(
    `<div r-model="{ abc }"></div>`,
    `<view class="_div" value="{{ abc }}" bindinput="proxyEvent" data-event-id="0" data-comp-id="{{ $k }}"></view>`
  )
} )
