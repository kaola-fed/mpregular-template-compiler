const compile = require( '../src' )

function compileAssert( input, expected ) {
  const compiled = compile( input )
  expect( compiled ).toBe( expected )
}

test( 'transform tag name', () => {
  compileAssert(
    `<div>foo</div>`,
    `<view>foo</view>`
  )
} )
