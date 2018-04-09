const clone = require( 'lodash.clonedeep' )
const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName, errorLog } = require( './helpers' )
const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const directives = require( './directives' )
const createHistory = require( './history' )

class Compiler {
  compile( template, options = {} ) {
    const tp = new Parser( template, {} )
    this.ast = tp.parse()
    this.options = options
    this.usedComponents = []
    this.marks = {
      eventId: 0,
      componentId: 0,
    }
    this.history = createHistory()

    return this.imports( {
      components: this.usedComponents,
      body: this.wrap( {
        name: options.name,
        body: this.render( this.ast )
      } ),
    } )
  }

  wrap( { name, body } ) {
    return name ?
      `<template name="${ name }">${ body }</template>` :
      `${ body }`
  }

  imports( { components, body } ) {
    return components.map( c => `<import src="${ c.src }" />\n` ).join( '' ) + body
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
    // do not pollute old ast
    const attrs = clone( ast.attrs || [] )
    const moduleId = this.options.moduleId

    // transform ast when element is in registered components
    const registeredComponents = this.options.components || {}
    const isComponent = Object.prototype.hasOwnProperty.call( registeredComponents, ast.tag )
    if ( isComponent ) {
      const definition = registeredComponents[ ast.tag ]
      // convert tag name to template
      ast.tag = 'template'
      const attr = attrs.filter( attr => attr.name === 'is' )[ 0 ]
      // `is` attr
      if ( attr ) {
        attr.value = definition.name
      } else {
        attrs.unshift( {
          mdf: void 0,
          name: 'is',
          type: 'attribute',
          value: definition.name
        } )
      }
      // saved for prefixing imports
      this.usedComponents.push( definition )
    }

    // make sure class is available ( exclude template tag )
    if ( beforeTagName !== 'template' && !attrs.some( attr => attr.name === 'class' ) ) {
      attrs.unshift( {
        mdf: void 0,
        name: 'class',
        type: 'attribute',
        value: ''
      } )
    }

    let attributeStr = attrs
      .map( attr => {
        const expr = new Parser( attr.value || '' ).parse()
        const value = this.render( expr )

        if ( attr.name === 'isolate' ) {
          // only two-way bind is supported
          errorLog( 'isolate is not supported' )
        }

        // class
        if ( attr.name === 'class' ) {
          return `class="_${ beforeTagName }${ moduleId ? ' ' + moduleId : '' }${ attr.value ? ' ' + value : '' }"`
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

    const needEventId = attrs.some(
      attr => (
        attr.name === 'r-model' ||
        attr.name.startsWith( 'on-' ) ||
        attr.name.startsWith( 'delegate-' ) ||
        attr.name.startsWith( 'de-' )
      )
    )

    if ( needEventId ) {
      // comp-id of nested component should be defined at runtime
      const lists = this.history.search( 'list' )
      const eventId = this.marks.eventId + lists.map( list => `-{{ ${ list.data.index } }}` ).join( '' )
      attributeStr = attributeStr + ` data-event-id="${ eventId }" data-comp-id="{{ $cid }}"`
      this.marks.eventId++
    }

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

  list( ast ) {
    const sequence = ast.sequence.raw
    const variable = ast.variable
    const index = `${ variable }_index`
    const body = ast.body
    const trackby = ast.track && ast.track.raw
    let wxkey = ''

    // maybe not supported
    // if ( this.history.searchOne( 'list' ) ) {
    //   errorLog( 'nested {#list}{/list} is not supported' )
    // }

    this.history.push( 'list', { variable, index } )

    if ( trackby ) {
      if ( variable === trackby ) {
        wxkey = '*this'
      } else {
        wxkey = trackby.split( '.' )[ 1 ]
      }
    }

    const rendered = `<block wx:for="{{ ${ sequence } }}" wx:for-item="${ variable }" wx:for-index="${ index }"${ wxkey ? ' wx:key="' + wxkey + '"' : '' }>${ this.render( body ) }</block>`

    this.history.pop( 'list' )

    return rendered
  }
}

module.exports = Compiler
