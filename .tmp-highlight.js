const SyntaxHighlighter = {
  // ------------------------------------------------------------
  // Single-pass tokenizer.
  //
  // Walks the RAW source once with one combined regex per
  // language and escapes text as it is emitted. It never runs
  // patterns over already-escaped HTML, so typing < > & can
  // never corrupt the editor markup (the old regex pipeline
  // matched inside its own <span> tags — that's what caused
  // the "bad stuff" when typing < or >).
  // ------------------------------------------------------------

  _escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _compile(rules, flags) {
    const src = rules.map(r => `(${r[0].source})`).join('|');
    const re = new RegExp(src, 'g' + (flags || ''));
    return { re, classes: rules.map(r => r[1]) };
  },

  highlight(code, filename) {
    if (!code) return '';
    if (code.length > 250000) return this._escape(code);
    const lang = LanguageDetector.detect(filename).name;
    const def = this.defs[lang];
    if (!def) return this._escape(code);

    const re = def.re;
    const classes = def.classes;
    re.lastIndex = 0;
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(code)) !== null) {
      if (m.index > last) out.push(this._escape(code.slice(last, m.index)));
      let cls = '';
      for (let i = 1; i < m.length; i++) {
        if (m[i] !== undefined) { cls = classes[i - 1]; break; }
      }
      out.push(cls ? `<span class="${cls}">${this._escape(m[0])}</span>` : this._escape(m[0]));
      last = re.lastIndex;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < code.length) out.push(this._escape(code.slice(last)));
    return out.join('');
  },

  // ---- shared token fragments (no capture groups inside) ----
  frag: {
    strDQ: /"(?:[^"\\\n]|\\.)*"/,
    strSQ: /'(?:[^'\\\n]|\\.)*'/,
    strBQ: /`(?:[^`\\]|\\.)*`/,
    strPY3: /"""[\s\S]*?"""|'''[\s\S]*?'''/,
    lcmt: /\/\/[^\n]*/,
    bcmt: /\/\*[\s\S]*?\*\//,
    hcmt: /#[^\n]*/,
    sqlcmt: /--[^\n]*/,
    htmlcmt: /<!--[\s\S]*?-->/,
    numC: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[uUlLfF]{0,2})?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/,
    numJS: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/,
    numDec: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
    fnCallJS: /[A-Za-z_$][\w$]*(?=\s*\()/,
    fnCall: /[A-Za-z_][\w]*(?=\s*\()/,
  },

  defs: {},
};

// ---------------- JavaScript family ----------------
const JS_RULES = [
  [/(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|true|false|null|undefined)\b/, 'hl-keyword'],
  [/\b(?:Math|JSON|console|window|document|globalThis|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|WeakMap|WeakSet|Promise|Error|TypeError|SyntaxError|ReferenceError|RangeError|Symbol|BigInt|Intl|Proxy|Reflect|parseInt|parseFloat|isNaN|isFinite|fetch|setTimeout|setInterval|clearTimeout|clearInterval|requestAnimationFrame|URL|URLSearchParams|Blob|FormData|AbortController|structuredClone|queueMicrotask)\b/, 'hl-builtin'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/, 'hl-number'],
  [/[A-Za-z_$][\w$]*(?=\s*\()/, 'hl-func'],
];
const TS_RULES = JS_RULES.slice(0, 2).concat([
  [/\b(?:interface|type|enum|namespace|declare|readonly|abstract|implements|private|protected|public|keyof|infer|satisfies|string|number|boolean|any|unknown|never|void|object|bigint|symbol|is|asserts|module)\b/, 'hl-keyword'],
], JS_RULES.slice(2));
const JSX_RULES = JS_RULES.slice(0, 2).concat([
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
], JS_RULES.slice(2));
const TSX_RULES = TS_RULES.slice(0, 2).concat([
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
], TS_RULES.slice(2));

SyntaxHighlighter.defs['JavaScript'] = SyntaxHighlighter._compile(JS_RULES);
SyntaxHighlighter.defs['TypeScript'] = SyntaxHighlighter._compile(TS_RULES);
SyntaxHighlighter.defs['JSX'] = SyntaxHighlighter._compile(JSX_RULES);
SyntaxHighlighter.defs['TSX'] = SyntaxHighlighter._compile(TSX_RULES);

// ---------------- C family ----------------
const C_KEYWORDS = /\b(?:alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/;
const C_TYPES = /\b(?:string|vector|map|set|list|pair|tuple|optional|variant|string_view|size_t|ssize_t|ptrdiff_t|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|FILE|std|cout|cin|cerr|endl|printf|scanf|malloc|calloc|realloc|free|strlen|strcpy|memcpy|memset|abs|fabs|sqrt|pow|rand|srand)\b/;
const C_RULES = [
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/(?:(?:^|(?<=\n))[ \t]*#[^\n]*)/, 'hl-keyword'],
  [C_KEYWORDS, 'hl-keyword'],
  [C_TYPES, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[uUlLfF]{0,2})?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
];
SyntaxHighlighter.defs['C++'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C/C++ Header'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C++ Header'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C#'] = SyntaxHighlighter._compile([
  [/@"(?:[^"]|"")*"|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|async|await|record|init|required|var|dynamic)\b/, 'hl-keyword'],
  [/\b(?:List|Dictionary|HashSet|Queue|Stack|IEnumerable|IList|ICollection|IDictionary|Exception|ArgumentException|ArgumentNullException|InvalidOperationException|Console|Math|String|DateTime|Task|Thread|Action|Func|Object|Array)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDmM]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Python ----------------
SyntaxHighlighter.defs['Python'] = SyntaxHighlighter._compile([
  [/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/#[^\n]*/, 'hl-comment'],
  [/@[A-Za-z_][\w.]*/, 'hl-keyword'],
  [/\b(?:and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None|self|cls)\b/, 'hl-keyword'],
  [/\b(?:print|len|range|type|str|int|float|bool|list|dict|set|tuple|object|super|isinstance|issubclass|enumerate|zip|map|filter|sorted|reversed|sum|min|max|abs|round|pow|divmod|open|input|repr|format|bytes|bytearray|memoryview|frozenset|complex|hash|id|callable|hasattr|getattr|setattr|delattr|vars|dir|help|Exception|ValueError|TypeError|KeyError|IndexError|AttributeError|NameError|StopIteration|FileNotFoundError|RuntimeError|ZeroDivisionError|ArithmeticError|__init__|__name__|__main__|__file__)\b/, 'hl-builtin'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?j?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- HTML / XML / SVG / Vue ----------------
const HTML_RULES = [
  [/<!--[\s\S]*?-->/, 'hl-comment'],
  [/<!DOCTYPE[^>]*>/i, 'hl-keyword'],
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/&(?:#[xX]?\d+|[A-Za-z][A-Za-z0-9]+);/, 'hl-attr'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
];
SyntaxHighlighter.defs['HTML'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['XML'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['SVG'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['Vue'] = SyntaxHighlighter._compile(HTML_RULES);

// ---------------- CSS / SCSS / Sass ----------------
const CSS_RULES = [
  [/\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/@[\w-]+/, 'hl-keyword'],
  [/#[0-9a-fA-F]{3,8}\b/, 'hl-number'],
  [/#[A-Za-z_][\w-]*/, 'hl-builtin'],
  [/\.[A-Za-z_][\w-]*/, 'hl-builtin'],
  [/\b\d[\d.]*(?:px|em|rem|vh|vw|vmin|vmax|%|s|ms|deg|fr|ch|ex|pt|cm|mm|dvh|svh|lvh)?\b/, 'hl-number'],
  [/[\w-]+(?=\s*:)/, 'hl-attr'],
];
SyntaxHighlighter.defs['CSS'] = SyntaxHighlighter._compile(CSS_RULES);
SyntaxHighlighter.defs['SCSS'] = SyntaxHighlighter._compile(CSS_RULES);
SyntaxHighlighter.defs['Sass'] = SyntaxHighlighter._compile(CSS_RULES);

// ---------------- SQL ----------------
SyntaxHighlighter.defs['SQL'] = SyntaxHighlighter._compile([
  [/--[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/'[^'\n]*'|"[^"\n]*"/, 'hl-string'],
  [/\b(?:select|from|where|insert|into|values|update|set|delete|create|table|drop|alter|join|left|right|inner|outer|full|cross|on|as|and|or|not|null|group|by|order|having|limit|offset|union|all|distinct|primary|key|foreign|references|index|view|procedure|function|trigger|begin|commit|rollback|cascade|case|when|then|else|end|exists|between|like|in|is|asc|desc|add|column|default|check|constraint|database|schema|grant|revoke|transaction|with|recursive|over|partition|rank|row_number|count|sum|avg|min|max|if|while|loop|declare|return|call|show|use|describe)\b/i, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- JSON ----------------
SyntaxHighlighter.defs['JSON'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"(?=\s*:)/, 'hl-attr'],
  [/"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\b(?:true|false|null)\b/, 'hl-keyword'],
  [/\b-?\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, 'hl-number'],
]);

// ---------------- Markdown ----------------
SyntaxHighlighter.defs['Markdown'] = SyntaxHighlighter._compile([
  [/^#{1,6}[^\n]*/, 'hl-keyword'],
  [/^(\*{3,}|-{3,}|_{3,})[^\n]*/, 'hl-number'],
  [/\[[^\]\n]+\]\([^)\s]+\)/, 'hl-string'],
  [/`[^`\n]+`/, 'hl-builtin'],
  [/^[ \t]*(?:[-*+]|\d+[.)])\s+[^\n]*/, 'hl-number'],
  [/^>[^\n]*/, 'hl-keyword'],
  [/\*\*[^*\n]+\*\*|__[^_\n]+__/, 'hl-string'],
  [/\*[^*\n]+\*|_[^_\n]+_/, 'hl-string'],
], 'm');

// ---------------- Shell ----------------
SyntaxHighlighter.defs['Shell'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/, 'hl-string'],
  [/\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|in|select|time|export|local|readonly|return|exit|echo|cd|ls|mkdir|rm|cp|mv|sudo|grep|sed|awk|cat|touch|chmod|chown|source|alias|unset|set|shift|exec|wait|let|declare|read|printf|pwd|curl|wget|git|node|npm|npx|yarn|python|python3|pip|pip3|make|tar|zip|unzip|find|head|tail|sort|uniq|wc|cut|tr|paste|file|which|man|history|kill|jobs|bg|fg|true|false)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);

// ---------------- YAML / TOML ----------------
SyntaxHighlighter.defs['YAML'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/[A-Za-z_][\w-]*(?=\s*:)/, 'hl-attr'],
  [/&[\w-]+|\*[\w-]+/, 'hl-builtin'],
  [/\b(?:true|false|null|yes|no|on|off|~)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);
SyntaxHighlighter.defs['TOML'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/\[\[?[^\]]+\]\]?/, 'hl-keyword'],
  [/[A-Za-z_][\w-]*(?=\s*=)/, 'hl-attr'],
  [/\b(?:true|false)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);

// ---------------- Rust ----------------
SyntaxHighlighter.defs['Rust'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\u\{[0-9a-fA-F]+\}|\\[nrt'"\\])'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/'[A-Za-z_]\w*/, 'hl-type'],
  [/\b(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|yield|box)\b/, 'hl-keyword'],
  [/\b(?:u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|f32|f64|bool|char|str|String|Vec|Option|Some|None|Result|Ok|Err|Box|Rc|Arc|HashMap|BTreeMap|HashSet|Iterator)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFiIuU]?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Go ----------------
SyntaxHighlighter.defs['Go'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|`[^`\n]*`/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:break|default|func|interface|select|case|defer|go|map|struct|chan|else|goto|package|switch|const|fallthrough|if|range|type|continue|for|import|return|var|true|false|nil|iota)\b/, 'hl-keyword'],
  [/\b(?:string|bool|byte|rune|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|complex64|complex128|error|any)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Java ----------------
SyntaxHighlighter.defs['Java'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/@[A-Za-z_][\w.]*/, 'hl-keyword'],
  [/\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null|var|record|sealed|permits|yield)\b/, 'hl-keyword'],
  [/\b(?:String|Integer|Long|Double|Float|Boolean|Character|Byte|Short|Object|System|Math|List|ArrayList|Map|HashMap|Set|HashSet|Collection|Arrays|Collections|Exception|RuntimeException|IllegalArgumentException|NullPointerException|IOException|File|Scanner|PrintStream|StringBuilder|Thread|Runnable)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?[fFdDlL]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Ruby ----------------
SyntaxHighlighter.defs['Ruby'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/#[^\n]*/, 'hl-comment'],
  [/:[A-Za-z_]\w*/, 'hl-builtin'],
  [/\b(?:alias|and|begin|break|case|class|def|defined|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield|require|require_relative|include|extend|attr_reader|attr_writer|attr_accessor)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*[!?]?(?=\s*\()/, 'hl-func'],
]);

// ---------------- PHP ----------------
SyntaxHighlighter.defs['PHP'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/, 'hl-comment'],
  [/\$[A-Za-z_]\w*/, 'hl-builtin'],
  [/\b(?:abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|true|false|null|void)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Swift ----------------
SyntaxHighlighter.defs['Swift'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|rethrows|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|catch|is|super|self|Self|throw|throws|try|true|false|nil|any|some|await|async|actor|nonisolated|convenience|dynamic|final|lazy|mutating|optional|override|required|weak)\b/, 'hl-keyword'],
  [/\b(?:Int|UInt|Float|Double|Bool|String|Character|Array|Dictionary|Set|Optional|Error|Void|Any|NSObject|UIView|UIViewController|URL|Data|Date)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Kotlin ----------------
SyntaxHighlighter.defs['Kotlin'] = SyntaxHighlighter._compile([
  [/"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:as|break|class|continue|do|else|false|for|fun|if|in|interface|is|null|object|package|return|super|this|throw|true|try|typealias|typeof|val|var|when|while|by|catch|constructor|delegate|dynamic|field|file|finally|get|import|init|param|property|receiver|set|setparam|where|actual|abstract|annotation|companion|const|crossinline|data|enum|expect|external|final|infix|inline|inner|internal|lateinit|noinline|open|operator|out|override|private|protected|public|reified|sealed|suspend|tailrec|vararg)\b/, 'hl-keyword'],
  [/\b(?:String|Int|Long|Double|Float|Boolean|Char|Byte|Short|Unit|Any|Nothing|List|MutableList|Map|MutableMap|Set|MutableSet|Array|Pair|Triple)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Dart ----------------
SyntaxHighlighter.defs['Dart'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|required|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield)\b/, 'hl-keyword'],
  [/\b(?:int|double|num|bool|String|Object|dynamic|List|Map|Set|Iterable|Future|Stream|void|Never|Null)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);
