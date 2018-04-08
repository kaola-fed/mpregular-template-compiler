const TAG_MAP = {
  div: 'view'
}

exports.transformTagName = function transformTagName( tagName ) {
  return TAG_MAP[ tagName ] || tagName
}
