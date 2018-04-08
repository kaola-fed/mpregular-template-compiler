const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName } = require( './helpers' )

class Compiler {
  compile( template, options = {} ) {
    const tp = new Parser( template, {} )
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
        const expr = new Parser( attr.value ).parse()
        const value = this.render( expr )

        // class
        if ( attr.name === 'class' ) {
          return `class="_${ beforeTagName }${ attr.value ? ' ' + value : '' }"`
        }

        // event
        if ( attr.name.startsWith( 'on-' ) ) {
          const eventName = transformEventName( attr.name.slice( 3 ) )
          return `bind${ eventName }="proxyEvent"`
        }

        // others
        return `${ attr.name }="${ value }"`
      } )
      .join( ' ' )

    const childrenStr = this.render( children )

    return `<${ afterTagName }${ attributeStr ? ' ' + attributeStr : '' }>${ childrenStr }</${ afterTagName }>`
  }

  text( ast ) {
    return ast.text || ''
  }

  expression( ast ) {
    const raw = ast.raw ? ast.raw.trim() : ''
    return `{{ ${ raw } }}`
  }
}

module.exports = Compiler
