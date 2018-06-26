const assert = require( './assert' )

test( 'class', () => {
  assert(
    `<div class="{active}">foo</div>`,
    `<view class="{{ __holders[ 'class' ] }}">foo</view>`
  )
} )

test( 'r-class', () => {
  assert(
  `<div class="static" r-class={{ 
    'active': a === 1,
    "active1": index 
    }}>foo</div>`,
  `<view class="{{ __holders[ 'class' ] }}">foo</view>`
)
} )

test( 'r-hide', () => {
  assert(
    `<div r-hide="{ a === 1 }">foo</div>`,
    `<view hidden="{{ a === 1 }}" class="_div">foo</view>`
  )
} )

test( 'r-hide with whitespace', () => {
  assert(
    `<div r-hide="{ a === 1 }  ">foo</div>`,
    `<view hidden="{{ a === 1 }}" class="_div">foo</view>`
  )
} )

test( 'r-model', () => {
  assert(
    `<div r-model="{ abc }"></div>`,
    `<view value="{{ abc }}" bindinput="proxyEvent" class="_div" data-event-id="0" data-comp-id="{{ $k }}"></view>`
  )
} )
