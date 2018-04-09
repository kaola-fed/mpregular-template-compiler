const assert = require( './assert' )

test( 'r-hide', () => {
  assert(
    `<div r-hide="{ a === 1 }">foo</div>`,
    `<view hidden="{{ a === 1 }}">foo</view>`
  )
} )

test( 'r-hide with whitespace', () => {
  assert(
    `<div r-hide="{ a === 1 }  ">foo</div>`,
    `<view hidden="{{ a === 1 }}">foo</view>`
  )
} )

test( 'r-model', () => {
  assert(
    `<div r-model="{ abc }"></div>`,
    `<view value="{{ abc }}" bindinput="proxyEvent"></view>`
  )
} )
