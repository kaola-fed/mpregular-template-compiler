const clone = require( 'lodash.clonedeep' )
const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName, nanoid } = require( './helpers' )
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
      localComponentIndex: 0,
      defaultSlotIndex: 0,
      rhtmlId: 0,
    }
    this.history = createHistory()
    this.usedExpressions = {
      get: {},
      set: {}
    }

    // parent should be component
    this.usedSlots = {
      default: {}
    }

    // mark whether need prefix `<import src="slots" />`
    this.hasInclude = false
    // mark whether need prefix `<import src="../wxparse/index" />`, global
    this.hasRhtml = false

    const rendered = this.render( this.ast )

    let prefix = ''
    prefix = prefix + ( this.hasInclude ? `<import src="slots" />\n` : '' )
    prefix = prefix + ( this.hasRhtml ? `<import src="../wxparse/index" />\n` : '' )

    const wxml = this.imports( {
      prefix,
      components: this.usedComponents,
      body: this.wrap( {
        name: options.name,
        body: rendered
      } ),
    } )

    const slots = this.renderSlots( this.usedSlots )

    const imports = this.imports( {
      prefix: '',
      components: this.usedComponents,
      body: ''
    } )

    return {
      // save components for those components used in slot
      components: this.usedComponents, // provided, but maybe not used
      imports,
      rawSlots: this.usedSlots, // provided, but maybe not used
      slots,
      ast: this.ast,
      wxml,
      expressions: this.usedExpressions
    }
  }

  renderSlots( slots ) {
    const defaultSlotMap = slots.default
    return Object.keys( defaultSlotMap ).map( slotId => {
      return this.wrap( {
        name: slotId,
        body: defaultSlotMap[ slotId ]
      } )
    } ).join( '\n' )
  }

  wrap( { name, body } ) {
    return name ?
      `<template name="${ name }">${ body }</template>` :
      `${ body }`
  }

  imports( { prefix = '', components, body } ) {
    return prefix + components.map( c => `<import src="${ c.src }" />\n` ).join( '' ) + body
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

    throw new Error( 'unexpected ast type "' + ast.type + '"' )
  }

  template( ast ) {
    this.hasInclude = true
    this.saveExpression( ast.content )
    // use parent data ($p)
    // import all slots first, who use this will give the $slot value
    return '<template is="{{ $defaultSlot }}" data="{{ ...$root[ $p ], $root }}"></template>'
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

    let hasSlot = false

    if ( isComponent && children && children.length > 0 ) {
      hasSlot = true
    }

    const defaultSlotId = nanoid()

    if ( isComponent ) {
      ast.localComponentIndex = this.marks.localComponentIndex

      const definition = registeredComponents[ ast.tag ]
      // saved for prefixing imports
      if ( !~this.usedComponents.indexOf( definition ) ) {
        this.usedComponents.push( definition )
      }

      // change tag name to template
      afterTagName = 'template'

      // save all expression on component attrs
      attrs.forEach( attr => {
        let expr = attr.value || ''

        // parse string to ast
        if ( typeof expr === 'string' ) {
          expr = new Parser( expr ).parse()
        }

        // only for saving expression purpose
        this.render( expr )
      } )

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
          `{{ ...$root[ $kk + '${ this.marks.localComponentIndex }' ${ lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' ) } ], $root, $defaultSlot: '${ hasSlot ? defaultSlotId : 'defaultSlot' }' }}` :
          `{{ ...$root[ $kk + '${ this.marks.localComponentIndex }' ], $root, $defaultSlot: '${ hasSlot ? defaultSlotId : 'defaultSlot' }' }}`
      } )

      this.marks.localComponentIndex++
    }

    // maybe attrs have two or more `r-hrml`s
    let hasRhtml = false

    let attributeStr = attrs
      .map( attr => {
        let value

        if ( attr.isRaw ) {
          // like data above, if marked as raw, do nothing
          value = attr.value
        } else {
          let expr = attr.value || ''

          // parse string to ast
          if ( typeof expr === 'string' ) {
            expr = new Parser( expr ).parse()
          }

          value = this.render( expr )
        }

        // class
        if ( attr.name === 'class' ) {
          return `class="_${ beforeTagName }${ moduleId ? ' ' + moduleId : '' }${ attr.value ? ' ' + value : '' }"`
        }

        if ( attr.name === 'r-html' ) {
          hasRhtml = true
          return ''
        }

        // a[href] -> navigator[url]
        if ( beforeTagName === 'a' && attr.name === 'href' ) {
          return attr.value ? `url="${ value }"` : ''
        }

        // event
        if ( attr.name.startsWith( 'on-' ) ) {
          // modifier: capture | catch | capture-catch
          const modifier = attr.mdf
          const eventName = transformEventName( attr.name.slice( 3 ) )
          const map = {
            capture: 'capture-bind:',
            catch: 'catch',
            'capture-catch': 'capture-catch:'
          }
          const eventPrefix = ( modifier && map[ modifier ] ) ? map[ modifier ] : 'bind'
          return `${ eventPrefix }${ eventName }="${ PROXY_EVENT_HANDLER_NAME }"`
        }

        if ( attr.name.startsWith( 'delegate-' ) || attr.name.startsWith( 'de-' ) ) {
          console.warn( 'delegate|de-<event> is not supported, transpiled to bind<event> automatically' )
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
      attributeStr = attributeStr + ` data-event-id="${ eventId }" data-comp-id="{{ $k }}"`
      ast.eventId = eventId
      this.marks.eventId++
    }

    // always execute render to save slots and expression
    let childrenStr = this.render( children )

    if ( hasSlot ) {
      this.usedSlots.default[ defaultSlotId ] = childrenStr
    }

    // override children with r-html content
    /* @example
      <div r-html="{ foo }"></div>
      ->
      <div>
        <template is="wxParse" data="{{ wxParseData: __wxparsed[ '0' + '-' + item_index + '-' + item2_index ] ? __wxparsed[ '0' + '-' + item_index + '-' + item2_index ].nodes : [] }}"></template>
      </div>
    */
    if ( hasRhtml ) {
      const lists = this.history.search( 'list' )
      const keypath = this.marks.rhtmlId + ' ' + lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' )

      childrenStr = `<template is="wxParse" data="{{ wxParseData: __wxparsed[ ${ keypath } ] ? __wxparsed[ ${ keypath } ].nodes : [] }}"></template>`

      ast.rhtmlId = this.marks.rhtmlId
      this.marks.rhtmlId++
      // for prefixing `import` after render complete
      this.hasRhtml = true
    }

    return `<${ afterTagName }${ attributeStr ? ' ' + attributeStr : '' }>${ isComponent ? '' : childrenStr }</${ afterTagName }>`
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

    this.saveExpression( ast.sequence )
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
