const { TAG_MAP, EVENT_MAP } = require( './const' )

exports.transformTagName = function transformTagName( tagName ) {
  return TAG_MAP[ tagName ] || tagName
}

exports.transformEventName = function transformEventName( eventName ) {
  return EVENT_MAP[ eventName ] || eventName
}

exports.errorLog = function ( message ) {
  throw new Error( message )
}

const isNode = typeof process !== 'undefined' && ( String( process ) ) === '[object process]'

exports.nanoid = function () {
  if ( isNode ) {
    return require( 'nanoid' )()
  }
  const format = require( 'nanoid/format' )
  const random = require( 'nanoid/random-browser' )
  return format( random, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~', 10 )
}
