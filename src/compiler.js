const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName } = require( './helpers' )
const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const directives = require( './directives' )

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
          return `bind${ eventName }="${ PROXY_EVENT_HANDLER_NAME }"`
        }

        if ( attr.name.startsWith( 'delegate-' ) || attr.name.startsWith( 'de-' ) ) {
          console.warn( 'delegate|de-<event> is not supported, transform to bind<event>' )
          const eventName = transformEventName( attr.name.slice( 3 ) )
          return `bind${ eventName }="proxyEvent"`
        }

        if ( typeof directives[ attr.name ] === 'function' ) {
          return directives[ attr.name ]( {
            attr,
            tag: ast,
            value
          } ) || ''
        }

        // others
        return `${ attr.name }="${ value }"`
      } )
      .filter( Boolean )
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

  'if'( ast ) {
    return `<block wx:if="{{ ${ ast.test.raw } }}">${ this.render( ast.consequent ) }</block><block wx:else>${ this.render( ast.alternate ) }</block>`
  }

  'list'( ast ) {
    const sequence = ast.sequence.raw
    const variable = ast.variable
    const body = ast.body
    const trackby = ast.track && ast.track.raw
    let wxkey = ''

    if ( trackby ) {
      if ( variable === trackby ) {
        wxkey = '*this'
      } else {
        wxkey = trackby.split( '.' )[ 1 ]
      }
    }

    return `<block wx:for="{{ ${ sequence } }}" wx:for-item="${ variable }" wx:for-index="${ variable }_index"${ wxkey ? ' wx:key="' + wxkey + '"' : '' }>${ this.render( body ) }</block>`
  }
}

module.exports = Compiler
