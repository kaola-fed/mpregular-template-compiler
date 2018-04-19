const clone = require( 'lodash.clonedeep' )
const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName, errorLog } = require( './helpers' )
const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const directives = require( './directives' )
const createHistory = require( './history' )
const _ = require( './parser/util' )

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
    this.usedExpressions = {
      get: {},
      set: {}
    }

    const wxml = this.imports( {
      components: this.usedComponents,
      body: this.wrap( {
        name: options.name,
        body: this.render( this.ast )
      } ),
    } )

    return {
      ast: this.ast,
      wxml,
      expressions: this.usedExpressions
    }
  }

  wrap( { name, body } ) {
    return name ?
      `<template name="${ name }">${ body }</template>` :
      `${ body }`
  }

  imports( { components, body } ) {
    return components.map( c => `<import src="${ c.src }" />\n` ).join( '' ) + body
  }

  saveExpression( expr ) {
    if ( !expr ) {
      return
    }

    /* eslint-disable */
    if ( expr.body ) {
      this.usedExpressions.get[ expr.body ] = new Function( _.ctxName, _.extName, _.prefix + 'return (' + expr.body + ')' )
    }

    if ( expr.setbody ) {
      this.usedExpressions.set[ expr.setbody ] = new Function( _.ctxName, _.setName, _.extName, _.prefix + expr.setbody )
    }
    /* eslint-enable */
  }

  render( ast ) {
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
    let afterTagName = transformTagName( beforeTagName )
    const children = ast.children || []
    // do not pollute old ast
    let attrs = clone( ast.attrs || [] )
    const moduleId = this.options.moduleId

    // transform ast when element is in registered components
    const registeredComponents = this.options.components || {}
    const isComponent = Object.prototype.hasOwnProperty.call( registeredComponents, ast.tag )

    // make sure class is available ( exclude template tag )
    if (
      !attrs.some( attr => attr.name === 'class' ) // has no class attribute
    ) {
      attrs.unshift( {
        mdf: void 0,
        name: 'class',
        type: 'attribute',
        value: ''
      } )
    }

    if ( isComponent ) {
      ast.componentId = this.marks.componentId
      this.marks.componentId++

      const definition = registeredComponents[ ast.tag ]
      // saved for prefixing imports
      this.usedComponents.push( definition )

      // change tag name to template
      afterTagName = 'template'

      // clean all attrs, we only need `is` and `data`
      attrs = []

      attrs.push( {
        mdf: void 0,
        name: 'is',
        type: 'attribute',
        value: definition.name
      } )

      const lists = this.history.search( 'list' )

      attrs.push( {
        mdf: void 0,
        name: 'data',
        type: 'attribute',
        isRaw: true,
        value: lists.length > 0 ?
          `{{ ...$root[ $kk + '0' ${ lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' ) } ].data, $root }}` :
          `{{ ...$root[ $kk + '0' ].data, $root }}`
      } )
    }

    let attributeStr = attrs
      .map( attr => {
        let value

        if ( attr.isRaw ) {
          // like data above, if marked as raw, do nothing
          value = attr.value
        } else {
          const expr = new Parser( attr.value || '' ).parse()
          value = this.render( expr )
        }

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
    this.saveExpression( ast )

    const raw = ast.raw ? ast.raw.trim() : ''
    return `{{ ${ raw } }}`
  }

  'if'( ast ) {
    this.saveExpression( ast.test )

    return `<block wx:if="{{ ${ ast.test.raw } }}">${ this.render( ast.consequent ) }</block><block wx:else>${ this.render( ast.alternate ) }</block>`
  }

  list( ast ) {
    const sequence = ast.sequence.raw
    const variable = ast.variable
    const index = `${ variable }_index`
    const body = ast.body
    const trackby = ast.track && ast.track.raw
    let wxkey = ''

    this.saveExpression( sequence )
    this.saveExpression( ast.track )

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
