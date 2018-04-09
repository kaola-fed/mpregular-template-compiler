const compile = require( '../src' )

function compileAssert( input, expected ) {
  const compiled = compile( input )
  expect( compiled ).toBe( expected )
}

module.exports = compileAssert
