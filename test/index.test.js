const assert = require( './assert' )

test( 'transform tag name', () => {
  assert(
    `<div>foo</div>`,
    `<view>foo</view>`
  )
} )
