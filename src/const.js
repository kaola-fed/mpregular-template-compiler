// https://github.com/Meituan-Dianping/mpvue/blob/2a947d0baff4b7b1c1dfb72ad66ebcce048f6f1f/src/platforms/mp/compiler/codegen/config/wxmlTagMap.js
/* eslint-disable */
const TAG_MAP = {
  'br': 'view',
  'hr': 'view',

  'p': 'view',
  'h1': 'view',
  'h2': 'view',
  'h3': 'view',
  'h4': 'view',
  'h5': 'view',
  'h6': 'view',
  'abbr': 'view',
  'address': 'view',
  'b': 'view',
  'bdi': 'view',
  'bdo': 'view',
  'blockquote': 'view',
  'cite': 'view',
  'code': 'view',
  'del': 'view',
  'ins': 'view',
  'dfn': 'view',
  'em': 'view',
  'strong': 'view',
  'samp': 'view',
  'kbd': 'view',
  'var': 'view',
  'i': 'view',
  'mark': 'view',
  'pre': 'view',
  'q': 'view',
  'ruby': 'view',
  'rp': 'view',
  'rt': 'view',
  's': 'view',
  'small': 'view',
  'sub': 'view',
  'sup': 'view',
  'time': 'view',
  'u': 'view',
  'wbr': 'view',

  // 表单元素
  'form': 'form',
  'input': 'input',
  'textarea': 'textarea',
  'button': 'button',
  'select': 'picker',
  'option': 'view',
  'optgroup': 'view',
  'label': 'label',
  'fieldset': 'view',
  'datalist': 'picker',
  'legend': 'view',
  'output': 'view',

  // 框架
  'iframe': 'view',
  // 图像
  'img': 'image',
  'canvas': 'canvas',
  'figure': 'view',
  'figcaption': 'view',

  // 音视频
  'audio': 'audio',
  'source': 'audio',
  'video': 'video',
  'track': 'video',
  // 链接
  'a': 'navigator',
  'nav': 'view',
  'link': 'navigator',
  // 列表
  'ul': 'view',
  'ol': 'view',
  'li': 'view',
  'dl': 'view',
  'dt': 'view',
  'dd': 'view',
  'menu': 'view',
  'command': 'view',

  // 表格table
  'table': 'view',
  'caption': 'view',
  'th': 'view',
  'td': 'view',
  'tr': 'view',
  'thead': 'view',
  'tbody': 'view',
  'tfoot': 'view',
  'col': 'view',
  'colgroup': 'view',

  // 样式 节
  'div': 'view',
  'main': 'view',
  'span': 'label',
  'header': 'view',
  'footer': 'view',
  'section': 'view',
  'article': 'view',
  'aside': 'view',
  'details': 'view',
  'dialog': 'view',
  'summary': 'view',

  'progress': 'progress',
  'meter': 'progress', // todo
  'head': 'view', // todo
  'meta': 'view', // todo
  'base': 'text', // todo
  // 'map': 'image', // TODO不是很恰当
  'area': 'navigator', // j结合map使用

  'script': 'view',
  'noscript': 'view',
  'embed': 'view',
  'object': 'view',
  'param': 'view',

  // https://mp.weixin.qq.com/debug/wxadoc/dev/component/
  // [...document.querySelectorAll('.markdown-section tbody td:first-child')].map(v => v.textContent).join(',\n')
  'view': 'view',
  'scroll-view': 'scroll-view',
  'swiper': 'swiper',
  'icon': 'icon',
  'text': 'text',
  // 'progress': 'progress',
  // 'button': 'button',
  // 'form': 'form',
  // 'input': 'input',
  'checkbox': 'checkbox',
  'radio': 'radio',
  'picker': 'picker',
  'picker-view': 'picker-view',
  'slider': 'slider',
  'switch': 'switch',
  // 'label': 'label',
  'navigator': 'navigator',
  // 'audio': 'audio',
  'image': 'image',
  // 'video': 'video',
  'map': 'map',
  // 'canvas': 'canvas',
  'contact-button': 'contact-button',
  'block': 'block'
}
/* eslint-enable */

const EVENT_MAP = {
  click: 'tap',
  touchstart: 'touchstart',
  touchmove: 'touchmove',
  touchcancel: 'touchcancel',
  touchend: 'touchend',
  tap: 'tap',
  longtap: 'longtap',
  input: 'input',
  change: 'change',
  submit: 'submit',
  blur: 'blur',
  focus: 'focus',
  reset: 'reset',
  confirm: 'confirm',
  columnchange: 'columnchange',
  linechange: 'linechange',
  error: 'error',
  scrolltoupper: 'scrolltoupper',
  scrolltolower: 'scrolltolower',
  scroll: 'scroll',
  load: 'load'
}

const PROXY_EVENT_HANDLER_NAME = 'proxyEvent'

exports.TAG_MAP = TAG_MAP
exports.EVENT_MAP = EVENT_MAP
exports.PROXY_EVENT_HANDLER_NAME = PROXY_EVENT_HANDLER_NAME
