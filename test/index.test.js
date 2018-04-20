const assert = require( './assert' )

test( 'transform tag name', () => {
  assert(
    `<div>foo</div>`,
    `<view class="_div">foo</view>`
  )
} )

test( 'insert class if not exist', () => {
  assert(
    `<div></div>`,
    `<view class="_div"></view>`
  )
} )

test( 'moduleId', () => {
  assert(
    `<div></div>`,
    `<view class="_div qqq"></view>`,
    {
      moduleId: 'qqq'
    }
  )
} )

test( 'name', () => {
  assert(
    `<div>foo</div>`,
    `<template name="qqq"><view class="_div">foo</view></template>`,
    {
      name: 'qqq'
    }
  )
} )

test( 'component', () => {
  assert(
    `<div><card title="{ abc }"></card></div>`,
    `<import src="aaa" />\n<view class="_div"><template is="bbb" title="{{ abc }}"></template></view>`,
    {
      components: {
        card: {
          src: 'aaa',
          name: 'bbb',
        }
      }
    }
  )
} )

test( 'event in list', () => {
  assert(
    `{#list items as item}<div on-click="{ this.onClick($event) }"></div>{/list}`,
    `<block wx:for="{{ items }}" wx:for-item="item" wx:for-index="item_index"><view class="_div" bindtap="proxyEvent" data-event-id="0-{{ item_index }}" data-k="{{ $k }}"></view></block>`,
    {}
  )
} )
