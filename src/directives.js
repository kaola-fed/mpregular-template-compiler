const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const { errorLog } = require( './helpers' )
const { DYNAMIC_CLASS } = require( './const' )
const babel = require( 'babel-core' )
const t = require( 'babel-types' )
const prettier = require( 'prettier' )
const generate = require( 'babel-generator' ).default
const template = require( 'babel-template' )

module.exports = {
  'r-class': rClass,

  'r-style': rStyle,

  'r-animation': notSupported,

  'r-anim': notSupported,

  ref: notSupported,

  'r-model': model,

  'r-hide': hide,

  styleObj
}

const hyphenateRE = /([^-])([A-Z])/g
const hyphenate = function ( str ) {
  return str
  .replace( hyphenateRE, '$1-$2' )
  .replace( hyphenateRE, '$1-$2' )
  .toLowerCase()
}

function transformObjectToString() {
// 把 { key: value } 转换成 'key:' + value + ';'
  const objectToStringVisitor = {
    ObjectExpression( path ) {
      const expression = path.node.properties.map( function ( propertyItem ) {
        const keyStr = getStrByNode( propertyItem.key, true )
        const key = keyStr ? hyphenate( keyStr ) : keyStr
        const ref = generate( t.expressionStatement( propertyItem.value ) )
        const val = ref.code
        return ( '\'' + key + ':\' + (' + ( val.slice( 0, -1 ) ) + ') + \';\'' )
      } ).join( '+' )

      const p = template( expression )( {} )
      path.replaceWith( p.expression )
    }
  }

  return { visitor: objectToStringVisitor }
}

function styleObj( styleBinding, staticStyle ) {
  if ( styleBinding === void 0 ) {
    styleBinding = ''
  }

  if ( !styleBinding && !staticStyle ) {
    return ''
  }
  if ( !styleBinding && staticStyle ) {
    return staticStyle
  }

  return transformDynamicStyle( staticStyle, styleBinding )
}

function transformDynamicStyle( staticStyle, styleBinding ) {
  if ( staticStyle === void 0 ) {
    staticStyle = ''
  }

  const result = babel.transform( ( '!' + styleBinding ), { plugins: [ transformObjectToString ] } )
  const cls = prettier.format( result.code, { semi: false, singleQuote: true } ).slice( 1 ).slice( 0, -1 ).replace( /\n|\r/g, '' )
  return ( staticStyle + ' {{' + cls + '}}' )
}

function rStyle() {
  return ''
}

function getStrByNode( node, onlyStr ) {
  if ( onlyStr === void 0 ) {
    onlyStr = false
  }

  if ( onlyStr ) {
    return node.value || node.name || ''
  }
  return node.type === 'StringLiteral' ? node : t.stringLiteral( node.name || '' )
}

function transformObjectToTernaryOperator() {
  const objectVisitor = {
    ObjectExpression( path ) {
      const elements = path.node.properties.map( function ( propertyItem ) {
        return t.conditionalExpression( propertyItem.value, getStrByNode( propertyItem.key ), t.stringLiteral( '' ) )
      } )
      path.replaceWith( t.arrayExpression( elements ) )
    }
  }

  return { visitor: objectVisitor }
}

function transformDynamicClass( clsBinding ) {
  const result = babel.transform( ( '!' + clsBinding ), { plugins: [ transformObjectToTernaryOperator ] } )

  const cls = prettier.format( result.code, { semi: false, singleQuote: true } ).slice( 1 ).slice( 0, -1 ).replace( /\n|\r/g, '' )

  return ( DYNAMIC_CLASS + '{{' + cls + '}}' )
}

function rClass( { attr } = {} ) {
  const str = attr.value.raw

  if ( str ) {
    return transformDynamicClass( str )
  }

  return ''
}

function model( { tag, value } = {} ) {
  const DEFAULT_EVENT_NAME = 'input'
  const tagEventMap = {
    input: 'input',
    textarea: 'input',
    select: 'change',
  }
  const tagName = tag.tag
  const eventName = tagEventMap[ tagName ] || DEFAULT_EVENT_NAME

  return `value="${ value }" bind${ eventName }="${ PROXY_EVENT_HANDLER_NAME }"`
}

function hide( { value } = {} ) {
  return `hidden="${ value }"`
}

function notSupported( { attr } = {} ) {
  errorLog( `${ attr.name } is not supported` )
}
