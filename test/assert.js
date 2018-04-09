const compile = require( '../src' )

function compileAssert( input, expected, options = {} ) {
  const compiled = compile( input, options )
  expect( compiled ).toBe( expected )
}

module.exports = compileAssert
