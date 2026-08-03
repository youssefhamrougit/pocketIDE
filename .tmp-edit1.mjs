import fs from 'node:fs';

const file = 'app.js';
let s = fs.readFileSync(file, 'utf8');

// ============ 1. Replace SyntaxHighlighter block ============
const shStart = s.indexOf('// ============================================================\n// Syntax Highlighting (lightweight, regex-based)\n// ============================================================');
const shEnd = s.indexOf('// ============================================================\n// Custom Textarea Editor (replaces CodeMirror 6)');
if (shStart === -1 || shEnd === -1) { console.error('syntax highlighter markers not found'); process.exit(1); }

const NEW_HIGHLIGHTER = `// ============================================================
// Syntax Highlighting — single-pass tokenizer
// (one replace pass, so typed < > can never corrupt the markup)
// ============================================================

const SyntaxHighlighter = {
  esc(code) {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  // One combined regex + one replace pass: inserted <span> markup is never rescanned.
  tokenize(code, defs) {
    const text = this.esc(code);
    if (!text.trim() || !defs || !defs.length) return text;
    const combined = new RegExp(defs.map(d => '(' + d.regex.source + ')').join('|'), 'gm');
    return text.replace(combined, (...args) => {
      const groups = args.slice(1, -2);
      for (let i = 0; i < defs.length; i++) {
        if (groups[i] !== undefined) return '<span class="' + defs[i].cls + '">' + groups[i] + '</span>';
      }
      return args[0];
    });
  },

  kw(list, cls = 'hl-keyword') { return { cls, regex: new RegExp('\\\\b(' + list.join('|') + ')\\\\b') }; },

  STR: /('(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*"|`(?:[^`\\\\]|\\\\.)*`)/,
  STR2: /('(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*")/,
  COMMENT: /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)/,
  NUM: /\\b(0x[0-9a-fA-F]+|\\d+\\.?\\d*(e[+-]?\\d+)?)\\b/,
  FN: /\\b([a-zA-Z_][\\w]*)(?=\\s*\\()/,

  LANGS: {
    JavaScript: { template: true, keywords: ['as','async','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','from','function','get','if','import','in','instanceof','let','new','of','return','set','static','super','switch','this','throw','try','typeof','var','void','while','with','yield'], types: ['string','number','boolean','symbol','bigint','object','undefined','null'], builtins: ['console','document','window','navigator','localStorage','sessionStorage','fetch','alert','confirm','prompt','Math','JSON','Date','Array','Object','String','Number','Boolean','RegExp','Map','Set','WeakMap','WeakSet','Promise','Error','TypeError','ReferenceError','SyntaxError','RangeError','Symbol','Proxy','Reflect','parseInt','parseFloat','isNaN','isFinite','setTimeout','setInterval','clearTimeout','clearInterval','globalThis','require','module','exports','process','Buffer','structuredClone'] },
    TypeScript: { template: true, keywords: ['as','async','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','enum','export','extends','finally','for','from','function','if','implements','import','in','infer','instanceof','interface','keyof','let','namespace','new','of','override','private','protected','public','readonly','return','satisfies','static','super','switch','this','throw','try','type','typeof','var','void','while','with','yield','abstract','declare'], types: ['string','number','boolean','symbol','bigint','object','undefined','null','any','unknown','never','void'], builtins: ['console','document','window','Math','JSON','Date','Array','Object','String','Number','Boolean','RegExp','Map','Set','Promise','Error','Symbol','Proxy','Reflect','fetch','setTimeout','setInterval','globalThis','require','module','exports','process','Buffer','type','interface','enum'] },
    JSX: { template: true, keywords: ['as','async','await','break','case','catch','class','const','continue','default','delete','do','else','export','extends','finally','for','from','function','if','import','in','instanceof','let','new','of','return','static','super','switch','this','throw','try','typeof','var','void','while','with','yield'], types: ['string','number','boolean','object','undefined','null'], builtins: ['console','document','window','React','useState','useEffect','useRef','useMemo','useCallback','useContext','createContext','Fragment','Component','Math','JSON','Date','Array','Object','String','Number','Boolean','Map','Set','Promise','Error','fetch','setTimeout','setInterval','props','children','className','onClick','onChange','onSubmit','return','import','export','default'] },
    TSX: { template: true, keywords: ['as','async','await','break','case','catch','class','const','continue','default','delete','do','else','enum','export','extends','finally','for','from','function','if','implements','import','in','instanceof','interface','let','new','of','return','static','super','switch','this','throw','try','type','typeof','var','void','while','with','yield'], types: ['string','number','boolean','object','undefined','null','any','unknown','never','void','ReactNode','ReactElement'], builtins: ['console','document','window','React','useState','useEffect','useRef','useMemo','useCallback','useContext','createContext','Fragment','Component','Math','JSON','Date','Array','Object','String','Number','Boolean','Map','Set','Promise','Error','fetch','setTimeout','setInterval','props','children','className','onClick','onChange','onSubmit'] },
    Vue: { template: true, keywords: ['as','async','await','break','case','catch','class','const','continue','default','delete','do','else','export','extends','finally','for','from','function','if','import','in','instanceof','let','new','of','return','static','super','switch','this','throw','try','typeof','var','void','while','with','yield'], types: ['string','number','boolean','object','undefined','null'], builtins: ['ref','reactive','computed','watch','watchEffect','onMounted','onUnmounted','onUpdated','defineComponent','defineProps','defineEmits','provide','inject','nextTick','h','createApp','toRef','toRefs','console','document','window','Math','JSON','Date','Array','Object','String','Number','Promise','Error','fetch','setTimeout','setInterval','props','emit'] },
    Python: { handler: 'python', keywords: ['and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','True','False','None'], builtins: ['print','len','range','str','int','float','list','dict','set','tuple','bool','bytes','bytearray','open','input','abs','all','any','bin','chr','complex','divmod','enumerate','eval','exec','filter','format','frozenset','getattr','globals','hasattr','hash','help','hex','id','isinstance','issubclass','iter','locals','map','max','memoryview','min','next','object','oct','ord','pow','property','repr','reversed','round','setattr','slice','sorted','staticmethod','sum','super','type','vars','zip','Exception','ValueError','TypeError','KeyError','IndexError','NameError','RuntimeError','AttributeError','StopIteration','__init__','__name__','__file__','__main__'] },
    'C++': { comments: 'slash', preprocessor: true, keywords: ['alignas','alignof','and','asm','auto','bool','break','case','catch','char','char8_t','char16_t','char32_t','class','concept','const','consteval','constexpr','constinit','const_cast','continue','co_await','co_return','co_yield','decltype','default','delete','do','double','dynamic_cast','else','enum','explicit','export','extern','false','float','for','friend','goto','if','inline','int','long','mutable','namespace','new','noexcept','nullptr','operator','private','protected','public','register','reinterpret_cast','requires','return','short','signed','sizeof','static','static_assert','static_cast','struct','switch','template','this','thread_local','throw','true','try','typedef','typeid','typename','union','unsigned','using','virtual','void','volatile','wchar_t','while'], types: ['int','char','float','double','bool','void','long','short','unsigned','signed','string','vector','auto','size_t'], builtins: ['std','cout','cin','cerr','clog','endl','string','vector','map','unordered_map','set','unordered_set','list','deque','stack','queue','priority_queue','pair','tuple','array','unique_ptr','shared_ptr','weak_ptr','make_unique','make_shared','printf','scanf','sprintf','malloc','calloc','realloc','free','size_t','int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t','uint64_t','stringstream','fstream','ifstream','ofstream','iostream','iterator','algorithm','sort','find','reverse','accumulate','min','max','abs','to_string','stoi','stod'] },
    C: { comments: 'slash', preprocessor: true, keywords: ['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','inline','int','long','register','restrict','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while','true','false','_Bool'], types: ['int','char','float','double','void','long','short','unsigned','signed','size_t'], builtins: ['printf','scanf','sprintf','snprintf','malloc','calloc','realloc','free','memcpy','memset','strlen','strcpy','strcmp','strcat','strncpy','strncmp','fopen','fclose','fread','fwrite','fgets','fprintf','fscanf','size_t','FILE','NULL','EXIT_SUCCESS','EXIT_FAILURE','int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t','uint64_t','errno','stdin','stdout','stderr'] },
    'C#': { comments: 'slash', preprocessor: true, keywords: ['abstract','as','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','var','virtual','void','volatile','while'], types: ['int','char','float','double','bool','byte','decimal','long','short','string','object','var','void','uint','ulong','sbyte','ushort'], builtins: ['Console','WriteLine','Write','ReadLine','Read','List','Dictionary','HashSet','IEnumerable','IEnumerator','Exception','ArgumentException','ArgumentNullException','Math','DateTime','TimeSpan','File','Directory','Path','Task','async','await','Select','Where','First','FirstOrDefault','Single','Any','All','Count','Sum','Min','Max','StringBuilder','Regex','Action','Func','Tuple','EventArgs'] },
    Java: { comments: 'slash', keywords: ['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','goto','if','implements','import','instanceof','int','interface','long','native','new','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','true','false','null'], types: ['int','char','float','double','boolean','byte','long','short','void','String'], builtins: ['System','out','err','in','String','Integer','Double','Float','Long','Short','Byte','Boolean','Character','Object','Math','Arrays','List','ArrayList','LinkedList','HashMap','TreeMap','Map','Set','HashSet','TreeSet','Collection','Collections','Exception','RuntimeException','IOException','NullPointerException','IllegalArgumentException','Thread','Runnable','PrintStream','Scanner','StringBuilder','Optional','Stream','Collectors','Comparator','Comparable'] },
    Go: { comments: 'slash', keywords: ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var'], types: ['string','int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','float32','float64','bool','byte','rune','error','any','comparable'], builtins: ['append','cap','close','complex','copy','delete','imag','len','make','new','panic','print','println','real','recover','nil','true','false','fmt','log','os','io','strings','strconv','sort','time','sync','errors','json','http','net','path','filepath','reflect','regexp','math','rand','atomic','context','flag','bufio'] },
    Rust: { comments: 'slash', keywords: ['as','async','await','break','const','continue','crate','dyn','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while'], types: ['i8','i16','i32','i64','i128','u8','u16','u32','u64','u128','f32','f64','bool','char','usize','isize','str'], builtins: ['String','Vec','Option','Some','None','Result','Ok','Err','Box','Rc','Arc','RefCell','HashMap','BTreeMap','HashSet','BTreeSet','VecDeque','LinkedList','Range','Iterator','IntoIterator','println','print','eprintln','eprint','panic','format','vec','assert','assert_eq','assert_ne','Send','Sync','Copy','Clone','Debug','Display','Drop','Default','From','Into','ToString','std'] },
    Dart: { template: true, comments: 'slash', keywords: ['abstract','as','assert','async','await','break','case','catch','class','const','continue','covariant','default','deferred','do','dynamic','else','enum','export','extends','extension','external','factory','false','final','finally','for','Function','get','hide','if','implements','import','in','interface','is','late','library','mixin','new','null','on','operator','part','required','rethrow','return','set','show','static','super','switch','sync','this','throw','true','try','typedef','var','void','while','with','yield'], types: ['String','int','double','num','bool','List','Map','Set','Object','dynamic','void','Never','Iterable'], builtins: ['print','Future','Stream','StreamController','DateTime','Duration','Function','assert','identical','identityHashCode','toString','contains','add','remove','length','first','last','isEmpty','isNotEmpty','MapEntry','RangeError','StateError','FormatException','UnimplementedError','Timer','Completer'] },
    Swift: { comments: 'slash', keywords: ['associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','protocol','public','rethrows','static','struct','subscript','super','switch','typealias','var','break','case','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','throw','throws','try','while','as','Any','catch','false','is','nil','self','Self','super','true','where'], types: ['Int','Int8','Int16','Int32','Int64','UInt','UInt8','UInt16','UInt32','UInt64','Double','Float','Bool','Character','String','Array','Dictionary','Set','Optional','Void'], builtins: ['print','some','any','Never','Error','Equatable','Hashable','Comparable','Codable','Identifiable','ObservableObject','Published','Foundation','UIView','UIViewController','SwiftUI','escaping','inout'] },
    Kotlin: { comments: 'slash', keywords: ['as','break','class','continue','do','else','false','for','fun','if','in','interface','is','null','object','package','return','super','this','throw','true','try','typealias','typeof','val','var','when','while','by','catch','constructor','delegate','dynamic','field','file','finally','get','import','init','param','property','receiver','set','setparam','where'], types: ['String','Int','Double','Float','Boolean','Long','Short','Byte','Char','Array','List','MutableList','Map','MutableMap','Set','MutableSet','Pair','Triple','Unit','Any','Nothing'], builtins: ['println','print','repeat','require','check','error','TODO','arrayListOf','listOf','mapOf','setOf','hashMapOf','hashSetOf','mutableListOf','mutableMapOf','mutableSetOf','with','apply','let','run','also','takeIf','takeUnless','sequenceOf','rangeTo','downTo','step','until'] },
    Ruby: { handler: 'ruby', keywords: ['alias','and','begin','break','case','class','def','defined','do','else','elsif','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield'], builtins: ['puts','print','p','pp','require','require_relative','load','attr_accessor','attr_reader','attr_writer','include','extend','prepend','new','each','map','select','reject','reduce','inject','collect','find','sort','grep','gets','chomp','split','join','File','Dir','String','Integer','Float','Array','Hash','Symbol','Proc','lambda','raise','loop','break','next','redo','retry','yield','super','self'] },
    PHP: { comments: 'slash', keywords: ['abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','die','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','enum','eval','exit','extends','final','finally','fn','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','insteadof','interface','isset','list','match','namespace','new','or','print','private','protected','public','readonly','require','require_once','return','static','switch','throw','trait','try','unset','use','var','while','xor','yield','true','false','null'], types: ['string','int','float','bool','array','object','mixed','void','iterable','callable','resource','null'], builtins: ['echo','print','count','sizeof','array_map','array_filter','array_reduce','array_merge','array_keys','array_values','array_push','array_pop','strlen','str_replace','strpos','substr','str_split','explode','implode','json_encode','json_decode','var_dump','print_r','file_get_contents','file_put_contents','fopen','fclose','fgets','fwrite','isset','unset','empty','is_null','is_array','is_string','is_int','is_float','is_bool','is_object','gettype','settype','intval','floatval','strval','boolval','header','session_start','mysqli','PDO','Exception','get_class','method_exists'] },
    Lua: { handler: 'lua', keywords: ['and','break','do','else','elseif','end','false','for','function','goto','if','in','local','nil','not','or','repeat','return','then','true','until','while'], builtins: ['print','require','type','tostring','tonumber','pairs','ipairs','next','select','setmetatable','getmetatable','rawget','rawset','rawequal','rawlen','error','assert','pcall','xpcall','coroutine','string','table','math','io','os','unpack','collectgarbage','load','loadfile','dofile','self','arg','_G','_VERSION'] },
    Zig: { comments: 'slash', keywords: ['as','async','await','break','catch','comptime','const','continue','defer','else','enum','errdefer','error','export','extern','fn','for','if','inline','noalias','noinline','opaque','or','orelse','packed','pub','resume','return','struct','suspend','switch','test','threadlocal','try','union','unreachable','usingnamespace','var','volatile','while'], types: ['u8','u16','u32','u64','u128','usize','i8','i16','i32','i64','i128','isize','f16','f32','f64','f128','bool','void','noreturn','comptime_int','comptime_float','anyerror','anytype','type'], builtins: ['std','ArrayList','HashMap','AutoHashMap','StringHashMap','print','panic','@import','@intCast','@floatCast','@intFromFloat','@floatFromInt','@as','@sizeOf','@alignOf','@offsetOf','@typeOf','@TypeOf','@rem','@mod','@divExact','@bitCast','@ptrCast','@alignCast','@errorName','@compileError','@panic','@breakpoint','@returnAddress','@field','@hasField','@hasDecl','@errSetCast','@intToError','@errorToInt','@setEvalBranchQuota','@setRuntimeSafety','@setCold'] },
    Shell: { handler: 'shell', keywords: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','in','select','until','time','export','local','readonly','return','shift','source','alias','declare','typeset','set','unset','trap','wait','eval','exec','exit','break','continue'], builtins: ['echo','printf','cat','ls','cd','pwd','grep','sed','awk','curl','wget','mkdir','rm','cp','mv','touch','chmod','chown','chgrp','find','ps','kill','tar','zip','unzip','gzip','git','npm','node','python','python3','pip','pip3','apt','apt-get','brew','sudo','env','export','source','which','test','true','false','head','tail','sort','uniq','wc','cut','tr','diff','date','sleep','nohup','read','let'] },
    SQL: { handler: 'sql', keywords: ['select','from','where','insert','into','values','update','set','delete','create','table','drop','alter','add','column','join','left','right','inner','outer','cross','full','on','as','and','or','not','null','is','group','by','order','having','limit','offset','union','all','distinct','primary','key','foreign','references','index','view','procedure','function','trigger','begin','commit','rollback','transaction','cascade','default','unique','check','between','like','in','exists','case','when','then','else','end','asc','desc','with','recursive','over','partition','window','rank','dense_rank','row_number','cast','convert'], builtins: ['count','sum','avg','min','max','concat','upper','lower','length','substring','substr','trim','ltrim','rtrim','now','curdate','curtime','date','year','month','day','hour','minute','second','ifnull','coalesce','nullif','floor','ceil','round','abs','mod','pow','sqrt'] },
    HTML: { handler: 'markup' },
    XML: { handler: 'markup' },
    SVG: { handler: 'markup' },
    CSS: { handler: 'css' },
    SCSS: { handler: 'css' },
    Sass: { handler: 'css' },
    JSON: { handler: 'json' },
    Markdown: { handler: 'markdown' },
    YAML: { handler: 'yaml' },
    TOML: { handler: 'toml' },
  },

  highlight(code, filename) {
    const lang = LanguageDetector.detect(filename).name;
    const def = this.LANGS[lang];
    if (!def) return this.esc(code);
    if (def.handler) return this[def.handler](code);
    const defs = [
      ...(def.preprocessor ? [{ cls: 'hl-keyword', regex: /^#[^\\n]*/gm }] : []),
      { cls: 'hl-string', regex: def.template ? this.STR : this.STR2 },
      { cls: 'hl-comment', regex: def.comments === 'hash' ? /(#[^\\n]*)/ : this.COMMENT },
      ...(def.keywords ? [this.kw(def.keywords)] : []),
      ...(def.types ? [this.kw(def.types, 'hl-type')] : []),
      ...(def.builtins ? [this.kw(def.builtins, 'hl-builtin')] : []),
      { cls: 'hl-function', regex: this.FN },
      { cls: 'hl-number', regex: this.NUM },
    ];
    return this.tokenize(code, defs);
  },

  python(code) {
    const d = this.LANGS.Python;
    return this.tokenize(code, [
      { cls: 'hl-string', regex: /('''[\\s\\S]*?'''|"""[\\s\\S]*?"""|'(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*")/ },
      { cls: 'hl-comment', regex: /#[^\\n]*/ },
      { cls: 'hl-keyword', regex: /@[\\w.]+/ },
      this.kw(d.keywords),
      this.kw(d.builtins, 'hl-builtin'),
      { cls: 'hl-function', regex: this.FN },
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  markup(code) {
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /&lt;!--[\\s\\S]*?--&gt;/ },
      { cls: 'hl-keyword', regex: /&lt;!doctype[^&]*/i },
      { cls: 'hl-tag', regex: /&lt;\\/?[a-zA-Z][\\w-]*/ },
      { cls: 'hl-attr', regex: /[\\w-]+(?==)/ },
      { cls: 'hl-string', regex: /"[^"]*"|'[^']*'/ },
    ]);
  },

  css(code) {
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /\\/\\*[\\s\\S]*?\\*\\// },
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-keyword', regex: /@[\\w-]+/ },
      { cls: 'hl-attr', regex: /([\\w-]+)(\\s*:)(?![\\w-])/ },
      { cls: 'hl-number', regex: /#[0-9a-fA-F]{3,8}\\b|\\b\\d+(\\.\\d+)?(px|em|rem|vh|vw|vmin|vmax|%|s|ms|fr|deg|rad|turn|ch|ex|pt|pc|in|cm|mm|dpi|dppx)?\\b/ },
      { cls: 'hl-builtin', regex: /\\.[\\w-]+/ },
      { cls: 'hl-tag', regex: /\\b(html|body|div|span|p|a|ul|ol|li|h[1-6]|table|tr|td|th|img|input|button|section|header|footer|nav|main|aside|form|label|select|option|textarea|video|audio|iframe|script|style|head|meta|link|title|strong|em|code|pre|blockquote|hr|br|figure|figcaption|article|time|small|mark|summary|details|dialog)\\b/ },
    ]);
  },

  json(code) {
    return this.tokenize(code, [
      { cls: 'hl-attr', regex: /"(?:[^"\\\\]|\\\\.)*"(?=\\s*:)/ },
      { cls: 'hl-string', regex: /"(?:[^"\\\\]|\\\\.)*"/ },
      { cls: 'hl-keyword', regex: /\\b(true|false|null)\\b/ },
      { cls: 'hl-number', regex: /-?\\b\\d+\\.?\\d*(e[+-]?\\d+)?\\b/ },
    ]);
  },

  markdown(code) {
    return this.tokenize(code, [
      { cls: 'hl-keyword', regex: /^#{1,6}\\s.*$/m },
      { cls: 'hl-builtin', regex: /`[^`\\n]+`/ },
      { cls: 'hl-string', regex: /\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__|\\B\\[[^\\]]+\\]\\([^)\\s]+\\)/ },
      { cls: 'hl-number', regex: /^(\\s*)([-*+]|\\d+\\.)\\s/m },
    ]);
  },

  sql(code) {
    const d = this.LANGS.SQL;
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /(--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)/ },
      { cls: 'hl-string', regex: this.STR2 },
      this.kw(d.keywords),
      this.kw(d.builtins, 'hl-builtin'),
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  shell(code) {
    const d = this.LANGS.Shell;
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /#[^\\n]*/ },
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-builtin', regex: /\\$\\{?[\\w]+}?/ },
      this.kw(d.keywords),
      this.kw(d.builtins, 'hl-builtin'),
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  yaml(code) {
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /#[^\\n]*/ },
      { cls: 'hl-attr', regex: /^[\\w.-]+(?=:)/m },
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-keyword', regex: /\\b(true|false|null|yes|no|on|off|undefined)\\b/i },
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  toml(code) {
    return this.tokenize(code, [
      { cls: 'hl-comment', regex: /#[^\\n]*/ },
      { cls: 'hl-keyword', regex: /^\\[\\[?[\\w. -]+\\]\\]?/m },
      { cls: 'hl-attr', regex: /^[\\w. -]+(?==)/m },
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-keyword', regex: /\\b(true|false)\\b/ },
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  ruby(code) {
    const d = this.LANGS.Ruby;
    return this.tokenize(code, [
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-comment', regex: /#[^\\n]*/ },
      this.kw(d.keywords),
      this.kw(d.builtins, 'hl-builtin'),
      { cls: 'hl-function', regex: this.FN },
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },

  lua(code) {
    const d = this.LANGS.Lua;
    return this.tokenize(code, [
      { cls: 'hl-string', regex: this.STR2 },
      { cls: 'hl-comment', regex: /--[^\\n]*/ },
      this.kw(d.keywords),
      this.kw(d.builtins, 'hl-builtin'),
      { cls: 'hl-function', regex: this.FN },
      { cls: 'hl-number', regex: this.NUM },
    ]);
  },
};

// ============================================================
// Code Completion — file-type aware suggestions
// ============================================================

const Completions = {
  data: {
    JavaScript: { keywords: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','typeof','instanceof','try','catch','finally','throw','async','await','import','export','from','default','null','undefined','true','false','in','of'], apis: ['console.log','console.error','console.warn','console.table','console.time','JSON.parse','JSON.stringify','Math.random','Math.floor','Math.ceil','Math.round','Math.max','Math.min','Math.abs','Math.pow','Math.sqrt','Array.from','Array.isArray','Object.keys','Object.values','Object.entries','Object.assign','Object.freeze','String.trim','String.split','String.join','String.replace','String.includes','String.startsWith','String.endsWith','String.toUpperCase','String.toLowerCase','Array.push','Array.pop','Array.shift','Array.unshift','Array.map','Array.filter','Array.reduce','Array.forEach','Array.find','Array.some','Array.every','Array.includes','Array.sort','Array.slice','Array.splice','Array.concat','Promise.resolve','Promise.reject','Promise.all','Promise.race','fetch','localStorage.getItem','localStorage.setItem','localStorage.removeItem','setTimeout','setInterval','clearTimeout','document.querySelector','document.querySelectorAll','document.getElementById','document.createElement','document.body','window.addEventListener','window.innerWidth','navigator.clipboard.writeText'] },
    TypeScript: { keywords: ['const','let','var','function','return','if','else','for','while','switch','case','break','continue','class','interface','type','enum','extends','implements','new','this','typeof','instanceof','try','catch','finally','throw','async','await','import','export','from','default','public','private','protected','readonly','abstract','static','null','undefined','true','false','in','of','keyof','as','satisfies'], apis: ['console.log','console.error','JSON.parse','JSON.stringify','Math.random','Math.floor','Math.ceil','Math.round','Math.max','Math.min','Math.abs','Array.from','Array.isArray','Object.keys','Object.values','Object.entries','Object.assign','Array.map','Array.filter','Array.reduce','Array.forEach','Array.find','Array.some','Array.every','Array.includes','Array.sort','Array.slice','Array.splice','Promise.resolve','Promise.all','fetch','setTimeout','setInterval','localStorage.getItem','localStorage.setItem','document.querySelector','document.getElementById','window.addEventListener'] },
    JSX: { keywords: ['const','let','var','function','return','if','else','for','while','switch','case','break','continue','class','extends','new','this','typeof','try','catch','finally','throw','async','await','import','export','from','default','null','undefined','true','false','in','of'], apis: ['useState','useEffect','useRef','useMemo','useCallback','useContext','createContext','React.Fragment','console.log','JSON.parse','JSON.stringify','Array.map','Array.filter','Array.reduce','Array.forEach','Array.find','Array.some','Array.every','Array.includes','Object.keys','Object.values','Object.entries','fetch','Promise.resolve','Promise.all','setTimeout','setInterval','className','onClick','onChange','onSubmit','props','children'] },
    TSX: { keywords: ['const','let','var','function','return','if','else','for','while','switch','case','break','continue','class','interface','type','enum','extends','implements','new','this','typeof','try','catch','finally','throw','async','await','import','export','from','default','public','private','protected','readonly','null','undefined','true','false','in','of'], apis: ['useState','useEffect','useRef','useMemo','useCallback','useContext','createContext','React.Fragment','ReactNode','console.log','JSON.parse','JSON.stringify','Array.map','Array.filter','Array.reduce','Array.forEach','Array.find','Array.some','Array.every','Array.includes','Object.keys','Object.values','Object.entries','fetch','Promise.resolve','Promise.all','setTimeout','setInterval','className','onClick','onChange','onSubmit','props','children'] },
    Vue: { keywords: ['const','let','var','function','return','if','else','for','while','switch','case','break','continue','class','extends','new','this','typeof','try','catch','finally','throw','async','await','import','export','from','default','null','undefined','true','false','in','of'], apis: ['ref','reactive','computed','watch','watchEffect','onMounted','onUnmounted','onUpdated','defineComponent','defineProps','defineEmits','provide','inject','nextTick','h','createApp','toRef','toRefs','console.log','JSON.parse','JSON.stringify','Array.map','Array.filter','Array.forEach','Object.keys','Object.values','Object.entries','fetch','Promise.resolve','setTimeout','setInterval'] },
    Python: { keywords: ['def','class','return','if','elif','else','for','while','break','continue','pass','import','from','as','try','except','finally','raise','with','lambda','yield','global','nonlocal','and','or','not','in','is','None','True','False','async','await','del','assert'], apis: ['print','len','range','str','int','float','list','dict','set','tuple','bool','input','open','with open','map','filter','sorted','enumerate','zip','sum','min','max','abs','round','isinstance','type','super','self','json.loads','json.dumps','os.path.join','os.listdir','os.makedirs','sys.argv','random.random','random.randint','math.sqrt','math.floor','math.ceil','datetime.datetime.now','re.match','re.search','re.findall','time.sleep','collections.Counter','itertools.product','string.upper','string.lower','string.strip','string.split','string.join'] },
    'C++': { keywords: ['int','char','float','double','bool','void','return','if','else','for','while','do','switch','case','break','continue','class','struct','public','private','protected','virtual','static','const','new','delete','this','try','catch','throw','namespace','using','template','typename','auto','constexpr','nullptr','true','false','enum','union','typedef','sizeof','include','define','endif'], apis: ['std::cout','std::cin','std::cerr','std::endl','std::string','std::vector','std::map','std::unordered_map','std::set','std::list','std::pair','std::tuple','std::unique_ptr','std::shared_ptr','std::make_unique','std::make_shared','std::sort','std::find','std::reverse','std::accumulate','std::min','std::max','std::abs','std::to_string','std::stoi','std::stod','printf','scanf','malloc','free','#include <iostream>','#include <vector>','#include <string>','#include <algorithm>','#include <map>','#include <cmath>','int main()','return 0','using namespace std'] },
    C: { keywords: ['int','char','float','double','void','return','if','else','for','while','do','switch','case','break','continue','struct','union','enum','typedef','static','const','extern','register','volatile','unsigned','signed','short','long','sizeof','include','define','endif','NULL'], apis: ['printf','scanf','sprintf','malloc','calloc','realloc','free','memcpy','memset','strlen','strcpy','strcmp','strcat','fopen','fclose','fread','fwrite','fgets','fprintf','fscanf','#include <stdio.h>','#include <stdlib.h>','#include <string.h>','#include <math.h>','int main()','return 0','size_t','FILE *'] },
    'C#': { keywords: ['public','private','protected','internal','class','struct','interface','enum','namespace','using','var','void','int','string','bool','double','float','return','if','else','for','foreach','while','do','switch','case','break','continue','new','this','base','static','const','readonly','try','catch','finally','throw','async','await','null','true','false','get','set','override','virtual','abstract','sealed','partial'], apis: ['Console.WriteLine','Console.Write','Console.ReadLine','Console.ReadKey','string.Join','string.Split','string.Replace','string.Contains','string.StartsWith','string.EndsWith','string.ToUpper','string.ToLower','List.Add','List.Remove','List.Contains','Dictionary.Add','Dictionary.ContainsKey','Math.Max','Math.Min','Math.Abs','Math.Round','Math.Floor','Math.Ceiling','Math.Pow','Math.Sqrt','DateTime.Now','File.ReadAllText','File.WriteAllText','File.Exists','Directory.CreateDirectory','Path.Combine','Task.Run','Thread.Sleep','string.IsNullOrEmpty','string.IsNullOrWhiteSpace','StringBuilder.Append','Regex.Match','Regex.Replace'] },
    Java: { keywords: ['public','private','protected','class','interface','enum','extends','implements','import','package','static','final','void','int','long','double','float','boolean','char','byte','short','return','if','else','for','while','do','switch','case','break','continue','new','this','super','try','catch','finally','throw','throws','abstract','synchronized','volatile','transient','null','true','false'], apis: ['System.out.println','System.out.print','System.out.printf','String.length','String.substring','String.split','String.replace','String.contains','String.startsWith','String.endsWith','String.toUpperCase','String.toLowerCase','String.trim','String.valueOf','Integer.parseInt','Integer.toString','Double.parseDouble','Math.max','Math.min','Math.abs','Math.round','Math.floor','Math.ceil','Math.pow','Math.sqrt','Math.random','ArrayList.add','ArrayList.get','ArrayList.remove','ArrayList.size','ArrayList.contains','HashMap.put','HashMap.get','HashMap.containsKey','HashMap.keySet','Arrays.asList','Arrays.sort','Collections.sort','List.of','Map.of','Set.of','Thread.sleep','LocalDate.now','StringBuilder.append','Optional.ofNullable'] },
    Go: { keywords: ['func','package','import','var','const','type','struct','interface','map','chan','if','else','for','range','switch','case','break','continue','return','defer','go','select','fallthrough','default','nil','true','false'], apis: ['fmt.Println','fmt.Printf','fmt.Sprintf','len','cap','append','make','new','copy','delete','strings.Join','strings.Split','strings.Replace','strings.Contains','strings.HasPrefix','strings.ToUpper','strings.ToLower','strconv.Atoi','strconv.Itoa','strconv.ParseFloat','math.Max','math.Min','math.Abs','math.Floor','math.Ceil','math.Pow','math.Sqrt','time.Now','time.Sleep','os.Open','os.Create','io.ReadAll','sort.Slice','sort.Strings','json.Marshal','json.Unmarshal','http.Get','http.HandleFunc','error','byte','rune','float64','int64','uint64','[]byte','[]string','map[string]string'] },
    Rust: { keywords: ['fn','let','mut','const','static','if','else','match','for','while','loop','break','continue','return','struct','enum','impl','trait','mod','use','pub','crate','self','Self','super','type','where','async','await','unsafe','move','ref','in','as','dyn','true','false'], apis: ['println!','print!','eprintln!','format!','vec!','String::from','String::new','String::push_str','String::len','String::trim','String::split','String::replace','String::to_uppercase','String::to_lowercase','str::parse','Vec::new','Vec::push','Vec::pop','Vec::len','Vec::contains','Vec::sort','Vec::iter','HashMap::new','HashMap::insert','HashMap::get','Option::unwrap','Option::unwrap_or','Result::unwrap','Result::expect','Some','None','Ok','Err','Box::new','Rc::new','Arc::new','assert_eq!','assert!','panic!','Iterator::map','Iterator::filter','Iterator::collect','Iterator::sum','i32','i64','u32','u64','f64','usize','bool','char'] },
    Dart: { keywords: ['void','var','final','const','class','extends','implements','mixin','enum','abstract','static','late','new','this','super','return','if','else','for','while','do','switch','case','break','continue','try','catch','finally','throw','async','await','yield','in','is','as','null','true','false','get','set','required','typedef'], apis: ['print','String.length','String.split','String.replaceAll','String.contains','String.startsWith','String.endsWith','String.toUpperCase','String.toLowerCase','String.trim','String.isEmpty','int.parse','double.parse','toString','List.add','List.remove','List.contains','List.length','List.isEmpty','List.map','List.where','List.reduce','List.fold','List.sort','List.toList','Map.containsKey','Map.keys','Map.values','Math.max','Math.min','Math.pow','Math.sqrt','DateTime.now','Future.delayed','Future.wait','Stream.fromIterable','setState','initState','build','StatelessWidget','StatefulWidget','MaterialApp','Scaffold','Text','Container','Row','Column','ListView','GestureDetector','ElevatedButton'] },
    Swift: { keywords: ['let','var','func','class','struct','enum','protocol','extension','init','deinit','return','if','else','guard','for','while','repeat','switch','case','break','continue','fallthrough','in','where','as','is','try','catch','throw','throws','defer','typealias','associatedtype','public','private','internal','fileprivate','open','static','final','override','mutating','subscript','nil','true','false','self','Self','super','Any'], apis: ['print','String.count','String.isEmpty','String.contains','String.hasPrefix','String.hasSuffix','String.split','String.replacingOccurrences','String.uppercased','String.lowercased','String.trimmingCharacters','Array.append','Array.remove','Array.contains','Array.count','Array.isEmpty','Array.map','Array.filter','Array.reduce','Array.sorted','Array.first','Array.last','Dictionary.updateValue','Dictionary.keys','Dictionary.values','Int.random','Double.random','min','max','abs','floor','ceil','round','pow','sqrt','Date.now','Timer.scheduledTimer','DispatchQueue.main.async','URLSession.shared.dataTask','Optional','some','any'] },
    Kotlin: { keywords: ['fun','val','var','class','object','interface','data','enum','sealed','companion','object','if','else','when','for','while','do','break','continue','return','try','catch','finally','throw','as','is','in','not','null','true','false','this','super','init','constructor','private','public','protected','internal','open','final','override','abstract','lateinit','by','get','set'], apis: ['println','print','String.length','String.isEmpty','String.isBlank','String.contains','String.startsWith','String.endsWith','String.substring','String.split','String.replace','String.trim','String.uppercase','String.lowercase','String.toInt','String.toDouble','List.add','List.remove','List.contains','List.size','List.isEmpty','List.map','List.filter','List.reduce','List.sorted','List.first','List.last','Map.containsKey','Map.keys','Map.values','maxOf','minOf','abs','round','floor','ceil','pow','sqrt','random','rangeTo','downTo','step','repeat','require','check','error','TODO','with','apply','let','run','also','takeIf'] },
    Ruby: { keywords: ['def','class','module','end','if','elsif','else','unless','case','when','while','until','for','in','do','return','break','next','redo','retry','begin','rescue','ensure','raise','yield','super','self','true','false','nil','and','or','not','then','lambda','proc'], apis: ['puts','print','p','pp','gets','chomp','require','require_relative','attr_accessor','attr_reader','attr_writer','include','extend','new','each','map','select','reject','reduce','inject','collect','find','sort','grep','split','join','length','empty?','include?','start_with?','end_with?','to_s','to_i','to_f','File.open','File.read','File.write','Dir.glob','Time.now','rand','sleep','loop','String.new','Array.new','Hash.new'] },
    PHP: { keywords: ['function','return','if','else','elseif','for','foreach','while','do','switch','case','break','continue','class','public','private','protected','static','final','abstract','interface','extends','implements','namespace','use','new','this','parent','self','try','catch','finally','throw','require','include','require_once','include_once','echo','print','isset','empty','unset','list','array','as','and','or','xor','not','true','false','null','global','const','var','yield'], apis: ['echo','print','count','sizeof','array_map','array_filter','array_reduce','array_merge','array_keys','array_values','array_push','array_pop','strlen','str_replace','strpos','substr','str_split','explode','implode','json_encode','json_decode','var_dump','print_r','file_get_contents','file_put_contents','fopen','fclose','fgets','fwrite','isset','unset','empty','is_null','is_array','is_string','is_int','is_float','is_bool','intval','floatval','strval','header','session_start','date','time','strtotime','htmlspecialchars','trim','ucfirst','strtolower','strtoupper','round','floor','ceil','abs','max','min','rand'] },
    Lua: { keywords: ['local','function','end','if','then','else','elseif','for','while','do','repeat','until','return','break','and','or','not','in','nil','true','false'], apis: ['print','require','type','tostring','tonumber','pairs','ipairs','next','select','setmetatable','getmetatable','rawget','rawset','error','assert','pcall','xpcall','string.format','string.gsub','string.match','string.find','string.rep','string.sub','string.len','string.upper','string.lower','table.insert','table.remove','table.concat','table.sort','table.unpack','math.floor','math.ceil','math.max','math.min','math.random','math.randomseed','math.abs','math.sqrt','math.pow','io.open','io.read','io.write','io.close','os.time','os.clock','os.date','coroutine.create','coroutine.resume','coroutine.yield'] },
    Zig: { keywords: ['fn','var','const','pub','return','if','else','for','while','switch','break','continue','defer','errdefer','try','catch','struct','enum','union','error','comptime','inline','export','extern','usingnamespace','test','null','undefined','true','false','orelse','and','or','not'], apis: ['std.debug.print','std.fmt.print','std.fmt.allocPrint','std.heap.page_allocator','std.heap.GeneralPurposeAllocator','std.ArrayList','std.StringHashMap','std.AutoHashMap','std.sort','std.mem.copy','std.mem.eql','std.mem.zeroes','std.mem.span','std.math.max','std.math.min','std.math.abs','std.math.pow','std.math.sqrt','std.process.args','std.fs.cwd','std.fs.File','std.io.getStdOut','std.io.getStdErr','@import','@intCast','@floatCast','@intFromFloat','@floatFromInt','@as','@sizeOf','@alignOf','@offsetOf','@typeOf','@TypeOf','@bitCast','@ptrCast','@panic','@compileError','@rem','@mod','@divExact','errdefer','try'] },
    Shell: { keywords: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','in','select','until','time','export','local','readonly','return','shift','source','alias','declare','typeset','set','unset','trap','wait','eval','exec','exit','break','continue'], apis: ['echo','printf','cat','ls','cd','pwd','grep','sed','awk','curl','wget','mkdir','rm','cp','mv','touch','chmod','chown','chgrp','find','ps','kill','tar','zip','unzip','gzip','git','npm','node','python','python3','pip','pip3','apt','apt-get','brew','sudo','env','export','source','which','test','true','false','head','tail','sort','uniq','wc','cut','tr','diff','date','sleep','nohup','read','let','&>','2>&1','$( )','` `'] },
    SQL: { keywords: ['select','from','where','insert','into','values','update','set','delete','create','table','drop','alter','add','column','join','left','right','inner','outer','cross','full','on','as','and','or','not','null','is','group','by','order','having','limit','offset','union','all','distinct','primary','key','foreign','references','index','view','procedure','function','trigger','begin','commit','rollback','transaction','cascade','default','unique','check','between','like','in','exists','case','when','then','else','end','asc','desc','with','recursive','over','partition','window'], apis: ['SELECT * FROM','INSERT INTO','UPDATE','DELETE FROM','CREATE TABLE','DROP TABLE','ALTER TABLE','COUNT(*)','SUM','AVG','MIN','MAX','CONCAT','UPPER','LOWER','LENGTH','SUBSTRING','TRIM','NOW()','COALESCE','NULLIF','CASE WHEN','GROUP BY','ORDER BY','LIMIT','OFFSET','LEFT JOIN','RIGHT JOIN','INNER JOIN','FULL OUTER JOIN','ON','AS','DISTINCT','WHERE','HAVING','BETWEEN','LIKE','IN','EXISTS','IS NULL','IS NOT NULL','PRIMARY KEY','FOREIGN KEY','REFERENCES','UNIQUE','INDEX','VIEW','JOIN'] },
    HTML: { keywords: [], apis: ['div','span','p','a','img','input','button','form','label','select','option','textarea','ul','ol','li','table','tr','td','th','thead','tbody','section','header','footer','nav','main','aside','article','h1','h2','h3','h4','h5','h6','script','style','link','meta','title','head','body','html','strong','em','code','pre','blockquote','iframe','video','audio','figure','figcaption','small','mark','summary','details','br','hr'] },
    CSS: { keywords: [], apis: ['color','background','background-color','background-image','background-size','background-position','background-repeat','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','border','border-radius','border-width','border-style','border-color','width','height','max-width','min-width','max-height','min-height','display','flex','grid','inline-block','block','none','position','relative','absolute','fixed','sticky','top','right','bottom','left','z-index','overflow','overflow-x','overflow-y','opacity','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-transform','text-overflow','white-space','word-wrap','vertical-align','cursor','pointer','transition','transform','translate','rotate','scale','animation','box-shadow','text-shadow','gap','justify-content','align-items','align-self','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','grid-template-columns','grid-template-rows','grid-gap','object-fit','filter','visibility','list-style','float','clear','outline','border-collapse','table-layout','content','::before','::after',':hover',':active',':focus',':first-child',':last-child',':nth-child'] },
    JSON: { keywords: [], apis: [] },
    Markdown: { keywords: [], apis: ['# ','## ','### ','- ','* ','1. ','[link](url)','![alt](image)','`code`','**bold**','*italic*','___','> quote','---','```'] },
    YAML: { keywords: [], apis: ['name:','version:','description:','author:','license:','dependencies:','devDependencies:','scripts:','main:','type:','version','true','false','null','- ','key:','value:'] },
    TOML: { keywords: [], apis: ['[package]','[dependencies]','name = ','version = ','edition = ','description = ','authors = ','license = ','true','false'] },
    'Plain Text': { keywords: [], apis: [] },
  },

  get(langName) {
    const d = this.data[langName];
    if (!d) return [];
    return [...(d.keywords || []), ...(d.apis || [])];
  },
};

// ============================================================
// Auto-complete dropdown (text-area based)
// ============================================================

class Autocomplete {
  constructor(editor) {
    this.editor = editor;
    this.popup = editor.popup;
    this.items = [];
    this.activeIndex = 0;
    this.prefix = '';
    this._bind();
  }

  _bind() {
    const ta = this.editor.textarea;
    ta.addEventListener('input', () => this.update());
    ta.addEventListener('keydown', (e) => this.onKeydown(e));
    ta.addEventListener('scroll', () => this.hide(), { passive: true });
    ta.addEventListener('blur', () => setTimeout(() => this.hide(), 150));
    document.addEventListener('click', (e) => {
      if (this.popup && this.popup.style.display === 'block' && !this.popup.contains(e.target)) this.hide();
    });
    if (!this.popup) return;
    this.popup.addEventListener('mousedown', (e) => e.preventDefault());
    this.popup.addEventListener('click', (e) => {
      const item = e.target.closest('.ac-item');
      if (item && item.dataset.index !== undefined) this.apply(parseInt(item.dataset.index, 10));
    });
  }

  update() {
    const ta = this.editor.textarea;
    const pos = ta.selectionStart;
    const text = ta.value;
    const before = text.substring(0, pos);
    const m = before.match(/[a-zA-Z_][\w.]*$/);
    const prefix = m ? m[0] : '';
    if (!prefix || this._inStringOrComment(text, pos)) { this.hide(); return; }
    const lang = LanguageDetector.detect(this.editor.filename).name;
    const all = Completions.get(lang);
    const starts = [];
    const contains = [];
    for (const c of all) {
      if (c.toLowerCase().startsWith(prefix.toLowerCase())) starts.push(c);
      else if (prefix.length >= 2 && c.toLowerCase().includes(prefix.toLowerCase())) contains.push(c);
    }
    const list = [...new Set([...starts, ...contains])].slice(0, 12);
    if (!list.length) { this.hide(); return; }
    this.items = list;
    this.prefix = prefix;
    this.activeIndex = 0;
    this.render();
    this.position();
  }

  _inStringOrComment(text, pos) {
    let q = null;
    for (let i = 0; i < pos; i++) {
      const ch = text[i];
      if (ch === '\\\\') { i++; continue; }
      if (ch === '"' || ch === "'" || ch === '`') {
        if (q === ch) q = null;
        else if (!q) q = ch;
        continue;
      }
      if (q) continue;
      if (ch === '/' && text[i + 1] === '/') { return true; }
    }
    return !!q;
  }

  render() {
    if (!this.popup) return;
    this.popup.innerHTML = '';
    this.items.forEach((label, i) => {
      const div = document.createElement('div');
      div.className = 'ac-item' + (i === this.activeIndex ? ' active' : '');
      div.dataset.index = i;
      const idx = label.toLowerCase().indexOf(this.prefix.toLowerCase());
      if (idx > 0) {
        div.appendChild(document.createTextNode(label.substring(0, idx)));
        const b = document.createElement('b');
        b.textContent = label.substring(idx, idx + this.prefix.length);
        div.appendChild(b);
        div.appendChild(document.createTextNode(label.substring(idx + this.prefix.length)));
      } else {
        div.textContent = label;
      }
      this.popup.appendChild(div);
    });
    this.popup.style.display = 'block';
  }

  position() {
    if (!this.popup) return;
    const ta = this.editor.textarea;
    const coords = this.editor.getCaretCoords();
    const wrapRect = this.editor.editorWrapper.getBoundingClientRect();
    const taRect = ta.getBoundingClientRect();
    const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 18;
    let left = coords.left + taRect.left - wrapRect.left;
    let top = coords.top + taRect.top - wrapRect.top + lineH + 2;
    const maxLeft = wrapRect.width - 240;
    if (left > maxLeft) left = Math.max(0, maxLeft);
    this.popup.style.left = left + 'px';
    this.popup.style.top = top + 'px';
  }

  onKeydown(e) {
    if (!this.items.length || this.popup.style.display !== 'block') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.items.length;
      this.render();
      this._scrollActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
      this.render();
      this._scrollActive();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      this.apply(this.activeIndex);
    } else if (e.key === 'Escape') {
      this.hide();
    }
  }

  apply(index) {
    const label = this.items[index];
    if (label === undefined) return;
    const ta = this.editor.textarea;
    const pos = ta.selectionStart;
    const start = pos - this.prefix.length;
    ta.value = ta.value.substring(0, start) + label + ta.value.substring(pos);
    ta.selectionStart = ta.selectionEnd = start + label.length;
    this.editor.content = ta.value;
    this.editor._updateHighlight();
    this.editor._updateLineNumbers();
    this.editor._emit('change', ta.value);
    ta.focus();
    this.hide();
  }

  _scrollActive() {
    const el = this.popup ? this.popup.querySelector('.ac-item.active') : null;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  hide() {
    if (this.popup) this.popup.style.display = 'none';
    this.items = [];
  }
}

// ============================================================
// Problem Detector — lightweight diagnostics as you type
// ============================================================

class ProblemDetector {
  analyze(code, langName) {
    const problems = this.scanDelimiters(code);
    if (/JavaScript|TypeScript|JSX|TSX|Vue/.test(langName)) problems.push(...this.jsChecks(code));
    else if (langName === 'Python') problems.push(...this.pythonChecks(code));
    else if (/HTML|XML|SVG/.test(langName)) problems.push(...this.htmlChecks(code));
    return problems;
  }

  scanDelimiters(code) {
    const problems = [];
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const opens = { '(': ')', '[': ']', '{': '}' };
    let line = 1;
    let col = 0;
    let quote = null;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '\\n') { line++; col = 0; continue; }
      col++;
      if (quote) {
        if (ch === '\\\\') { i++; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '/' && code[i + 1] === '/') { i++; while (i < code.length && code[i] !== '\\n') i++; continue; }
      if (ch === '/' && code[i + 1] === '*') {
        i += 2;
        while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
        i++;
        continue;
      }
      if (opens[ch]) { stack.push({ ch: opens[ch], line, col }); continue; }
      if (pairs[ch]) {
        const top = stack.pop();
        if (!top) problems.push({ line, col, message: "Unexpected '" + ch + "'", severity: 'error' });
        else if (top.ch !== ch) problems.push({ line, col, message: "Expected '" + top.ch + "' but found '" + ch + "'", severity: 'error' });
      }
    }
    for (const o of stack) problems.push({ line: o.line, col: o.col, message: "Unclosed '" + o.ch + "'", severity: 'error' });
    if (quote) problems.push({ line, col: col + 1, message: 'Unterminated string literal', severity: 'error' });
    return problems;
  }

  jsChecks(code) {
    const out = [];
    const reEq = /(?<![=!])==(?!=)/g;
    let m;
    while ((m = reEq.exec(code))) out.push({ line: this.lineOf(code, m.index), col: this.colOf(code, m.index), message: 'Use === (strict equality) instead of ==', severity: 'warning' });
    const reSc = /;;/g;
    while ((m = reSc.exec(code))) out.push({ line: this.lineOf(code, m.index), col: this.colOf(code, m.index), message: 'Extra semicolon', severity: 'warning' });
    const reDbg = /\\bdebugger\\b/g;
    while ((m = reDbg.exec(code))) out.push({ line: this.lineOf(code, m.index), col: this.colOf(code, m.index), message: 'Debugger statement left in code', severity: 'warning' });
    return out;
  }

  pythonChecks(code) {
    const lines = code.split('\\n');
    const hasTab = lines.some(l => /^\\t/.test(l));
    const hasSpace = lines.some(l => /^ /.test(l));
    const out = [];
    if (hasTab && hasSpace) out.push({ line: 1, col: 1, message: 'Mixed tabs and spaces in indentation', severity: 'warning' });
    return out;
  }

  htmlChecks(code) {
    const VOID = new Set(['img', 'input', 'br', 'hr', 'link', 'meta', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
    const TAGS = ['div', 'span', 'p', 'a', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'header', 'footer', 'nav', 'main', 'aside', 'article', 'form', 'label', 'select', 'option', 'textarea', 'button', 'script', 'style', 'head', 'body', 'html', 'title', 'strong', 'em', 'code', 'pre', 'blockquote', 'iframe', 'video', 'audio', 'figure', 'figcaption', 'time', 'small', 'mark', 'summary', 'details'];
    const out = [];
    for (const t of TAGS) {
      const openRe = new RegExp('<' + t + '(\\\\s|>)', 'g');
      const closeRe = new RegExp('</' + t + '>', 'g');
      let open = 0;
      let lastOpenLine = 1;
      let m;
      while ((m = openRe.exec(code))) {
        open++;
        lastOpenLine = this.lineOf(code, m.index);
      }
      const close = (code.match(closeRe) || []).length;
      if (open > close) out.push({ line: lastOpenLine, col: 1, message: 'Tag <' + t + '> is not closed', severity: 'warning' });
    }
    return out;
  }

  lineOf(code, idx) {
    return (code.substring(0, idx).match(/\\n/g) || []).length + 1;
  }

  colOf(code, idx) {
    const nl = code.lastIndexOf('\\n', idx);
    return idx - nl;
  }
}
`;

s = s.slice(0, shStart) + NEW_HIGHLIGHTER + '\n' + s.slice(shEnd);
console.log('syntax highlighter + completion + problem modules inserted');

// ============ 2. Insert Git classes before PocketIDE ============
const gitStart = s.indexOf('// ============================================================\n// PocketIDE - Main Application');
if (gitStart === -1) { console.error('pocketide marker not found'); process.exit(1); }

const GIT_CLASSES = `// ============================================================
// Git Integration — localStorage-backed fs + isomorphic-git (offline)
// ============================================================

class GitFS {
  constructor(projectId) {
    this.projectId = projectId;
    this._storeKey = 'pocketide_git_' + projectId;
    this._data = null;
    this._dirty = false;
    this._saveTimer = null;
    this._load();
    this.promises = this._createPromiseAPI();
  }

  _load() {
    try {
      const r = localStorage.getItem(this._storeKey);
      this._data = r ? JSON.parse(r) : { '/': { type: 'dir', children: {}, mtime: Date.now(), mode: 0o755 } };
    } catch {
      this._data = { '/': { type: 'dir', children: {}, mtime: Date.now(), mode: 0o755 } };
    }
  }

  _markDirty() {
    this._dirty = true;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._flush(), 300);
  }

  _flush() {
    if (this._dirty) {
      try { localStorage.setItem(this._storeKey, JSON.stringify(this._data)); } catch (e) { console.warn('GitFS: localStorage write failed', e); }
      this._dirty = false;
    }
  }

  flush() { if (this._saveTimer) clearTimeout(this._saveTimer); this._flush(); }

  _normalize(p) {
    if (!p) return '/';
    p = String(p).replace(/\\\\\\\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\\/+/g, '/');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  _resolve(path) {
    path = this._normalize(path);
    if (path === '/') return this._data['/'];
    const parts = path.split('/').filter(Boolean);
    let node = this._data['/'];
    for (const part of parts) {
      if (!node || node.type !== 'dir') return null;
      node = (node.children || {})[part];
      if (!node) return null;
    }
    return node;
  }

  _ensureParent(path) {
    path = this._normalize(path);
    if (path === '/') return { parent: this._data['/'], name: null };
    const parts = path.split('/').filter(Boolean);
    const name = parts.pop();
    let node = this._data['/'];
    for (const part of parts) {
      if (!node.children) node.children = {};
      if (!(part in node.children)) node.children[part] = { type: 'dir', children: {}, mtime: Date.now(), mode: 0o755 };
      node = node.children[part];
      if (node.type !== 'dir') throw new Error('ENOTDIR: Not a directory — ' + path);
    }
    if (!node.children) node.children = {};
    return { parent: node, name };
  }

  async _walk(dirPath) {
    const results = [];
    const entries = await this.promises.readdir(dirPath);
    for (const entry of entries) {
      const full = dirPath === '/' ? '/' + entry : dirPath + '/' + entry;
      const st = await this.promises.stat(full);
      if (st.isDirectory()) results.push(...(await this._walk(full)));
      else results.push(full.startsWith('/') ? full.substring(1) : full);
    }
    return results;
  }

  _createPromiseAPI() {
    const self = this;
    return {
      async readFile(path, options = {}) {
        const node = self._resolve(path);
        if (!node || node.type !== 'file') { const e = new Error('ENOENT: no such file, open ' + path); e.code = 'ENOENT'; throw e; }
        let content = node.content;
        if (options.encoding === 'utf8') {
          if (content instanceof Uint8Array) return new TextDecoder().decode(content);
          if (content && content.type === 'Buffer' && Array.isArray(content.data)) return new TextDecoder().decode(new Uint8Array(content.data));
          return String(content || '');
        }
        if (typeof content === 'string') return new TextEncoder().encode(content);
        if (content && content.type === 'Buffer' && Array.isArray(content.data)) return new Uint8Array(content.data);
        return content || new Uint8Array(0);
      },
      async writeFile(path, data) {
        const { parent, name } = self._ensureParent(path);
        let stored;
        if (typeof data === 'string') stored = data;
        else if (data instanceof Uint8Array) stored = { type: 'Buffer', data: Array.from(data) };
        else if (Array.isArray(data)) stored = { type: 'Buffer', data: Array.from(data) };
        else if (data && data.type === 'Buffer') stored = data;
        else stored = String(data || '');
        parent.children[name] = { type: 'file', content: stored, mtime: Date.now(), mode: 0o644 };
        self._markDirty();
      },
      async unlink(path) {
        const { parent, name } = self._ensureParent(path);
        if (parent.children && name && name in parent.children) { delete parent.children[name]; self._markDirty(); }
      },
      async readdir(path) {
        const node = self._resolve(path);
        if (!node || node.type !== 'dir') { const e = new Error('ENOENT: no such directory, scandir ' + path); e.code = 'ENOENT'; throw e; }
        return Object.keys(node.children || {}).sort();
      },
      async mkdir(path, options = {}) {
        if (self._resolve(path)) return;
        const { parent, name } = self._ensureParent(path);
        parent.children[name] = { type: 'dir', children: {}, mtime: Date.now(), mode: options.mode || 0o755 };
        self._markDirty();
      },
      async rmdir(path) {
        const { parent, name } = self._ensureParent(path);
        if (parent.children && name && name in parent.children) {
          const node = parent.children[name];
          if (node.type !== 'dir') throw new Error('ENOTDIR: not a directory — ' + path);
          if (node.children && Object.keys(node.children).length > 0) throw new Error('ENOTEMPTY: directory not empty — ' + path);
          delete parent.children[name];
          self._markDirty();
        }
      },
      async stat(path) {
        const node = self._resolve(path);
        if (!node) { const e = new Error('ENOENT: no such file or directory, stat ' + path); e.code = 'ENOENT'; throw e; }
        const isFile = node.type === 'file';
        const size = isFile ? (typeof node.content === 'string' ? node.content.length : (node.content && node.content.data ? node.content.data.length : 0)) : 0;
        return {
          isDirectory: () => node.type === 'dir',
          isFile: () => node.type === 'file',
          isSymbolicLink: () => false,
          size,
          mode: node.mode || (node.type === 'dir' ? 0o755 : 0o644),
          mtime: new Date(node.mtime || Date.now()),
          ctime: new Date(node.mtime || Date.now()),
        };
      },
      lstat(path) { return this.stat(path); },
      async readlink() { const e = new Error('ENOSYS: readlink not supported'); e.code = 'ENOSYS'; throw e; },
      async symlink() { const e = new Error('ENOSYS: symlink not supported'); e.code = 'ENOSYS'; throw e; },
      async rename(oldPath, newPath) {
        try {
          const d = await this.readFile(oldPath);
          await this.writeFile(newPath, d);
          await this.unlink(oldPath);
          self._markDirty();
          return;
        } catch {}
        try {
          const entries = await this.readdir(oldPath);
          await this.mkdir(newPath);
          for (const e of entries) await this.rename(oldPath === '/' ? '/' + e : oldPath + '/' + e, newPath === '/' ? '/' + e : newPath + '/' + e);
          await this.rmdir(oldPath);
          self._markDirty();
        } catch {
          const e = new Error('ENOENT: no such file, rename ' + oldPath + ' -> ' + newPath);
          e.code = 'ENOENT';
          throw e;
        }
      },
    };
  }
}

class GitIntegration {
  constructor(projectId, fs) {
    this.projectId = projectId;
    this.fs = fs;
    this.dir = '/';
    this.initialized = false;
    this.author = { name: 'PocketIDE User', email: 'user@pocketide.local' };
  }

  async init() {
    try {
      const branches = await git.listBranches({ fs: this.fs, dir: this.dir });
      this.initialized = Array.isArray(branches);
      if (this.initialized && branches.length === 0) this.initialized = true;
    } catch {
      this.initialized = false;
    }
    return this.initialized;
  }

  async initRepo() { await git.init({ fs: this.fs, dir: this.dir }); this.initialized = true; }

  async getStatus() {
    if (!this.initialized) return [];
    try { return await git.statusMatrix({ fs: this.fs, dir: this.dir }); } catch { return []; }
  }

  async stageFile(filepath) { await git.add({ fs: this.fs, dir: this.dir, filepath }); }

  async commit(message) { return await git.commit({ fs: this.fs, dir: this.dir, message, author: this.author }); }

  async getCurrentBranch() { try { return await git.currentBranch({ fs: this.fs, dir: this.dir }); } catch { return null; } }

  async listBranches() { try { return await git.listBranches({ fs: this.fs, dir: this.dir }); } catch { return []; } }

  async createBranch(name) { await git.branch({ fs: this.fs, dir: this.dir, ref: name }); }

  async checkout(ref) { await git.checkout({ fs: this.fs, dir: this.dir, ref }); }

  async getLog(depth = 10) { try { return await git.log({ fs: this.fs, dir: this.dir, depth }); } catch { return []; } }

  async writeFile(path, content) {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? current + '/' + parts[i] : parts[i];
      try { await this.fs.promises.mkdir(current); } catch {}
    }
    await this.fs.promises.writeFile(path, content);
  }

  async importFiles(files) {
    for (const file of files) {
      const data = Storage.readFile(this.projectId, file.path);
      if (data && data.content !== undefined) await this.writeFile(file.path, data.content);
    }
  }

  parseStatusMatrix(matrix) {
    const changes = [];
    for (const [filepath, head, workdir, stage] of matrix) {
      if (filepath.startsWith('.git')) continue;
      if (head === 0 && workdir === 1 && stage === 0) changes.push({ path: filepath, status: '?', staged: false });
      else if (head === 1 && workdir === 2 && stage === 1) changes.push({ path: filepath, status: 'M', staged: false });
      else if (head === 1 && workdir === 2 && stage === 2) changes.push({ path: filepath, status: 'M', staged: true });
      else if (head === 1 && workdir === 1 && stage === 2) changes.push({ path: filepath, status: 'M', staged: true });
      else if (head === 1 && workdir === 0 && stage === 1) changes.push({ path: filepath, status: 'D', staged: false });
      else if (head === 1 && workdir === 0 && stage === 0) changes.push({ path: filepath, status: 'D', staged: true });
      else if (head === 0 && workdir === 0 && stage === 2) changes.push({ path: filepath, status: 'A', staged: true });
      else if (head === 0 && workdir === 2 && stage === 2) changes.push({ path: filepath, status: 'A', staged: true });
      else if (head === 0 && workdir === 1 && stage === 2) changes.push({ path: filepath, status: 'A', staged: true });
      else if (head === 0 && workdir === 2 && stage === 0) changes.push({ path: filepath, status: '?', staged: false });
    }
    return changes;
  }
}

class GitPanel {
  constructor(integration, callbacks = {}) {
    this.git = integration;
    this.callbacks = callbacks;
    this.changes = [];
    this.commits = [];
    this.currentBranch = 'main';
    this._bound = false;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._bindEvents());
    else this._bindEvents();
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;
    const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(evt, fn); };
    on('btn-git-init', 'click', () => this._initRepo());
    on('btn-git-init-inline', 'click', () => this._initRepo());
    on('btn-git-refresh', 'click', () => this.refresh());
    on('git-branch-bar', 'click', () => this._showBranchSwitcher());
    on('git-branch-name', 'click', () => this._showBranchSwitcher());
    on('git-branch-icon', 'click', () => this._showBranchSwitcher());
    on('btn-git-commit', 'click', () => this._doCommit());

    const commitInput = document.getElementById('git-commit-input');
    if (commitInput) {
      commitInput.addEventListener('input', () => this._updateCommitBtn());
      commitInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this._doCommit(); }
      });
    }

    const changesList = document.getElementById('git-changes-list');
    if (changesList) {
      changesList.addEventListener('click', (e) => {
        const item = e.target.closest('.git-change-item');
        if (item && item.dataset.path) this._stageFile(item.dataset.path);
      });
    }
  }

  async refresh() {
    this._showLoading(true);
    try {
      if (!this.git.initialized) await this.git.init();
      if (this.git.initialized) {
        this.currentBranch = (await this.git.getCurrentBranch()) || 'main';
        const matrix = await this.git.getStatus();
        this.changes = this.git.parseStatusMatrix(matrix);
        this.commits = await this.git.getLog(10);
      }
    } catch (e) { console.warn('Git refresh error:', e); }
    this._showLoading(false);
    this._render();
  }

  _render() {
    const content = document.getElementById('git-content');
    const uninit = document.getElementById('git-uninit');
    const branchName = document.getElementById('git-branch-name');
    const changesList = document.getElementById('git-changes-list');
    const changesCount = document.getElementById('git-changes-count');
    const commitInput = document.getElementById('git-commit-input');
    const commitBtn = document.getElementById('btn-git-commit');
    const commitsList = document.getElementById('git-commits-list');
    const commitsCount = document.getElementById('git-commits-count');
    const initialized = this.git.initialized;
    if (content) content.style.display = initialized ? 'flex' : 'none';
    if (uninit) uninit.style.display = initialized ? 'none' : 'block';
    if (branchName) branchName.textContent = this.currentBranch || 'main';
    if (commitInput) commitInput.disabled = !initialized;
    if (!initialized) return;

    if (changesList) {
      changesList.innerHTML = '';
      if (this.changes.length === 0) {
        const e = document.createElement('div');
        e.className = 'git-empty-msg';
        e.textContent = 'No changes — clean working tree';
        changesList.appendChild(e);
      } else {
        for (const ch of this.changes) {
          const item = document.createElement('div');
          item.className = 'git-change-item';
          item.dataset.path = ch.path;
          const stagedLabel = ch.staged ? '<span class="git-change-stage">staged</span>' : '';
          item.innerHTML = '<span class="git-change-status ' + ch.status + '">' + ch.status + '</span><span class="git-change-file">' + ch.path + '</span>' + stagedLabel;
          changesList.appendChild(item);
        }
      }
    }
    if (changesCount) changesCount.textContent = '(' + this.changes.length + ')';
    if (commitBtn) commitBtn.disabled = true;
    this._updateCommitBtn();

    if (commitsList) {
      commitsList.innerHTML = '';
      if (this.commits.length === 0) {
        const e = document.createElement('div');
        e.className = 'git-empty-msg';
        e.textContent = 'No commits yet';
        commitsList.appendChild(e);
      } else {
        for (const c of this.commits) {
          const item = document.createElement('div');
          item.className = 'git-commit-item';
          const shortOid = c.oid.substring(0, 7);
          const msg = (c.commit.message || '').split('\\n')[0];
          const ts = c.commit.author.timestamp * 1000;
          item.innerHTML = '<span class="git-commit-oid">' + shortOid + '</span><span class="git-commit-msg">' + this._escapeHtml(msg) + '</span><span class="git-commit-meta">' + this._timeAgo(new Date(ts)) + '</span>';
          commitsList.appendChild(item);
        }
      }
    }
    if (commitsCount) commitsCount.textContent = '(' + this.commits.length + ')';
    const statusBranch = document.getElementById('status-branch');
    if (statusBranch) statusBranch.textContent = this.currentBranch || 'local';
  }

  _updateCommitBtn() {
    const input = document.getElementById('git-commit-input');
    const btn = document.getElementById('btn-git-commit');
    if (!btn) return;
    if (!this.git.initialized || !input) { btn.disabled = true; return; }
    btn.disabled = !input.value.trim();
  }

  async _initRepo() {
    this._showLoading(true);
    try {
      const files = Storage.getProjectFilesList(this.git.projectId);
      await this.git.initRepo();
      await this.git.importFiles(files);
      await this.git.commit('Initial commit');
      await this.refresh();
    } catch (e) {
      console.error('Git init error:', e);
      alert('Failed to initialize repository: ' + e.message);
    }
    this._showLoading(false);
  }

  async _doCommit() {
    const input = document.getElementById('git-commit-input');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;
    this._showLoading(true);
    try {
      for (const change of this.changes) {
        if (!change.staged) await this.git.stageFile(change.path);
      }
      const sha = await this.git.commit(msg);
      console.log('Git commit: ' + sha.substring(0, 7) + ' — ' + msg);
      if (input) input.value = '';
      await this.refresh();
      if (this.callbacks.onCommit) this.callbacks.onCommit();
    } catch (e) {
      console.error('Commit error:', e);
      alert('Commit failed: ' + e.message);
    }
    this._showLoading(false);
  }

  async _stageFile(path) {
    this._showLoading(true);
    try {
      await this.git.stageFile(path);
      await this.refresh();
    } catch (e) { console.error('Stage error:', e); }
    this._showLoading(false);
  }

  async _showBranchSwitcher() {
    if (!this.git.initialized) return;
    const branches = await this.git.listBranches();
    const current = await this.git.getCurrentBranch();
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');
    if (!modal) return;

    title.textContent = 'Switch Branch';
    input.style.display = 'none';
    confirm.textContent = 'New Branch';
    modal.style.display = 'flex';

    const list = document.createElement('div');
    list.className = 'git-branch-list';
    for (const b of branches) {
      const item = document.createElement('div');
      item.className = 'branch-list-item' + (b === current ? ' active' : '');
      item.innerHTML = '<span class="branch-check">' + (b === current ? '\\u2713' : '') + '</span><span>' + b + '</span>';
      item.addEventListener('click', async () => {
        if (b === current) return;
        try {
          await this.git.checkout(b);
          if (this.callbacks.onBranchSwitch) this.callbacks.onBranchSwitch(b);
          await this.refresh();
        } catch (e) { console.error('Checkout error:', e); alert('Checkout failed: ' + e.message); }
        close();
      });
      list.appendChild(item);
    }
    const box = modal.querySelector('.modal-box');
    const actions = document.getElementById('modal-actions');
    if (box && actions) box.insertBefore(list, actions);

    const confirmOrig = confirm._listener || (() => {});
    confirm._listener = () => {
      if (confirm._newBranchMode !== true) {
        input.style.display = 'block';
        input.value = '';
        input.placeholder = 'New branch name...';
        confirm.textContent = 'Create';
        confirm._newBranchMode = true;
        input.focus();
        input.onkeydown = async (e) => {
          if (e.key === 'Enter' && input.value.trim()) {
            try {
              await this.git.createBranch(input.value.trim());
              await this.git.checkout(input.value.trim());
              if (this.callbacks.onBranchSwitch) this.callbacks.onBranchSwitch(input.value.trim());
              await this.refresh();
            } catch (e) { console.error('Branch create error:', e); }
            close();
          }
        };
      }
    };
    confirm.addEventListener('click', confirm._listener);

    const close = () => {
      modal.style.display = 'none';
      input.style.display = '';
      confirm.textContent = 'OK';
      confirm._newBranchMode = false;
      input.onkeydown = null;
      if (list.parentNode) list.parentNode.removeChild(list);
    };
    cancel.addEventListener('click', close);
  }

  _showLoading(visible) {
    const el = document.getElementById('git-loading');
    if (el) el.style.display = visible ? 'flex' : 'none';
  }

  _timeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return Math.floor(days / 30) + 'mo ago';
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

`;

s = s.slice(0, gitStart) + GIT_CLASSES + s.slice(gitStart);
console.log('git classes inserted');

fs.writeFileSync(file, s);
console.log('app.js updated OK');
