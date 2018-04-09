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
