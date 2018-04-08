const TemplateParser = require( './parser/Parser' )
const { transformTagName } = require( './helpers' )

class Compiler {
  compile( template, options = {} ) {
    const tp = new TemplateParser( template, {} )
    this.ast = tp.parse()
    this.options = options
    return this.render( this.ast )
  }

  render( ast ) {
    console.log( ast )

    if ( Array.isArray( ast ) ) {
      return ast
        .map( v => this.render( v ) )
        .join( '' )
    }

    if ( typeof this[ ast.type ] === 'function' ) {
      return this[ ast.type ]( ast )
    }

    throw new Error( 'unexpected ast type', ast.type )
  }

  element( ast ) {
    const beforeTagName = ast.tag || 'div'
    const afterTagName = transformTagName( beforeTagName )
    const children = ast.children || []
    const attrs = ast.attrs || []

    const attributeStr = attrs
      .map( attr => {
        if ( attr.name === 'class' ) {
          return `class="_${ beforeTagName } ${ attr.value }"`
        }

        return this.render( attr )
      } )
      .join( ' ' )

    const childrenStr = this.render( children )

    return `<${ afterTagName } ${ attributeStr }>${ childrenStr }</${ afterTagName }>`
  }

  attribute( ast ) {
    return `${ ast.name }="${ ast.value }"`
  }

  text( ast ) {
    return ast.text || ''
  }

  expression( ast ) {
    return ast.raw || ''
  }
}

module.exports = Compiler
