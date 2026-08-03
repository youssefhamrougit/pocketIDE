// ============================================================
// Autocomplete — file-type-aware suggestions dropdown
// ============================================================

const Autocomplete = {
  aliases: {
    'JSX': 'JavaScript', 'TSX': 'TypeScript', 'TypeScript': 'JavaScript',
    'C': 'C++', 'C#': 'C#', 'C/C++ Header': 'C++', 'C++ Header': 'C++',
    'SCSS': 'CSS', 'Sass': 'CSS', 'XML': 'HTML', 'SVG': 'HTML', 'Vue': 'HTML',
  },

  data: {
    'JavaScript': {
      keywords: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','async','await','try','catch','finally','throw','import','from','export','default','typeof','instanceof','in','of','null','undefined','true','false','delete','void','yield','static','super','get','set','arrow'],
      builtins: ['console.log','console.error','console.warn','console.table','document.getElementById','document.querySelector','document.querySelectorAll','document.createElement','window.addEventListener','window.setInterval','fetch','JSON.parse','JSON.stringify','Math.random','Math.floor','Math.max','Math.min','Math.round','Date.now','setTimeout','setInterval','clearTimeout','Promise.resolve','Promise.all','Array.from','Array.isArray','Object.keys','Object.values','Object.entries','Object.assign','parseInt','parseFloat','isNaN','String','Number','Boolean'],
      snippets: {
        'for': 'for (let i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'forof': 'for (const ${item} of ${items}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'else': '} else {\n  ${0}\n}',
        'fn': 'function ${name}(${params}) {\n  ${0}\n}',
        'arrow': '(${params}) => {\n  ${0}\n}',
        'log': 'console.log(${0});',
        'try': 'try {\n  ${0}\n} catch (err) {\n  console.error(err);\n}',
        'fetch': 'fetch(${url})\n  .then(res => res.json())\n  .then(data => {\n    ${0}\n  });',
      },
    },
    'Python': {
      keywords: ['def','class','return','if','elif','else','for','while','in','not','and','or','try','except','finally','with','as','import','from','lambda','yield','pass','break','continue','global','nonlocal','assert','raise','del','is','None','True','False','async','await','match','case','self'],
      builtins: ['print','len','range','type','str','int','float','bool','list','dict','set','tuple','object','super','isinstance','enumerate','zip','map','filter','sorted','sum','min','max','abs','round','open','input','repr','format','bytes','hash','id','vars','dir','ValueError','TypeError','KeyError','IndexError','Exception','__init__','__name__','__main__'],
      snippets: {
        'def': 'def ${name}(${params}):\n    ${0}\n',
        'class': 'class ${Name}:\n    def __init__(self, ${args}):\n        ${0}\n',
        'if': 'if ${cond}:\n    ${0}\n',
        'for': 'for ${item} in ${items}:\n    ${0}\n',
        'while': 'while ${cond}:\n    ${0}\n',
        'main': 'if __name__ == "__main__":\n    ${0}\n',
        'try': 'try:\n    ${0}\nexcept ${Exception} as e:\n    print(e)\n',
      },
    },
    'C++': {
      keywords: ['int','char','float','double','bool','void','auto','const','static','struct','class','public','private','protected','namespace','using','return','if','else','for','while','do','switch','case','break','continue','new','delete','this','nullptr','true','false','template','typename','typedef','enum','union','virtual','override','inline','extern','sizeof','unsigned','signed','long','short','string','vector','map','set','include','main'],
      builtins: ['std::cout','std::cin','std::endl','std::string','std::vector','std::map','std::set','printf','scanf','malloc','free','sizeof','abs','sqrt','pow','max','min','strlen','strcpy','memcpy','memset','fopen','fclose','fread','fwrite'],
      snippets: {
        'main': 'int main() {\n  ${0}\n  return 0;\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'while': 'while (${cond}) {\n  ${0}\n}',
        'class': 'class ${Name} {\npublic:\n  ${Name}() {}\n  ${0}\n};',
        'fn': '${type} ${name}(${params}) {\n  ${0}\n}',
        'cout': 'std::cout << ${0} << std::endl;',
      },
    },
    'C#': {
      keywords: ['namespace','using','class','public','private','protected','internal','static','void','int','string','bool','double','float','var','const','readonly','return','if','else','for','foreach','while','switch','case','break','continue','new','this','base','null','true','false','try','catch','finally','throw','async','await','record','enum','interface','delegate','event','get','set','in','out','ref'],
      builtins: ['Console.WriteLine','Console.ReadLine','Console.Write','Math.Max','Math.Min','Math.Abs','Math.Pow','Math.Sqrt','DateTime.Now','string.Format','List','Dictionary','HashSet','Task.Run','String.IsNullOrEmpty','String.Join','Convert.ToInt32','Enumerable.Range','LINQ','Where','Select','ToList','FirstOrDefault'],
      snippets: {
        'main': 'static void Main(string[] args) {\n  ${0}\n}',
        'class': 'public class ${Name} {\n  ${0}\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'foreach': 'foreach (var ${item} in ${items}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'wl': 'Console.WriteLine(${0});',
      },
    },
    'HTML': {
      keywords: ['div','span','p','a','img','ul','ol','li','table','tr','td','th','form','input','button','select','option','textarea','label','header','footer','nav','main','section','article','aside','h1','h2','h3','h4','h5','h6','br','hr','script','style','link','meta','title','body','head','html','class','id','href','src','style'],
      builtins: ['<div class=""></div>','<a href=""></a>','<img src="" alt=""/>','<input type="text" />','<button></button>','<ul><li></li></ul>','<table>','<form>','<script>','<link rel="stylesheet" href="">'],
      snippets: {
        'doctype': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${0}</title>\n</head>\n<body>\n\n</body>\n</html>',
        'div': '<div class="${cls}">\n  ${0}\n</div>',
        'a': '<a href="${url}">${0}</a>',
        'img': '<img src="${src}" alt="${alt}" />',
        'script': '<script>\n  ${0}\n</script>',
        'link': '<link rel="stylesheet" href="${href}" />',
      },
    },
    'CSS': {
      keywords: ['color','background','background-color','margin','padding','border','border-radius','font-size','font-family','font-weight','display','position','top','right','bottom','left','width','height','min-width','max-width','min-height','max-height','overflow','flex','flex-direction','justify-content','align-items','gap','grid','grid-template-columns','gap','opacity','z-index','transition','transform','box-shadow','text-align','text-decoration','line-height','cursor','pointer','hover','active','focus','media'],
      builtins: ['rgba','rgb','hsl','calc','var','clamp','min','max','linear-gradient','radial-gradient','translate','scale','rotate','bold','italic','underline','center','flex-start','flex-end','space-between','space-around','relative','absolute','fixed','sticky'],
      snippets: {
        'flex': 'display: flex;\njustify-content: center;\nalign-items: center;',
        'media': '@media (max-width: 768px) {\n  ${0}\n}',
        'hover': '.${sel}:hover {\n  ${0}\n}',
        'font': 'font-family: ${family}, sans-serif;\nfont-size: ${size}px;\ncolor: ${color};',
      },
    },
    'SQL': {
      keywords: ['select','from','where','insert','into','values','update','set','delete','create','table','drop','alter','join','left','right','inner','outer','on','as','and','or','not','null','group','by','order','having','limit','offset','union','all','distinct','primary','key','foreign','references','index','view','count','sum','avg','min','max','between','like','in','is','exists','case','when','then','else','end','begin','commit','rollback'],
      builtins: ['COUNT(*)','SUM(column)','AVG(column)','MIN(column)','MAX(column)','NOW()','UPPER(col)','LOWER(col)','LENGTH(col)','COALESCE(col, 0)','DISTINCT col','ORDER BY col DESC','GROUP BY col','LIMIT 10'],
      snippets: {
        'selectall': 'SELECT * FROM ${table}\nWHERE ${cond}\nLIMIT 100;',
        'insert': 'INSERT INTO ${table} (${cols})\nVALUES (${vals});',
        'update': 'UPDATE ${table}\nSET ${col} = ${val}\nWHERE ${cond};',
        'delete': 'DELETE FROM ${table}\nWHERE ${cond};',
        'createtable': 'CREATE TABLE ${name} (\n  id INTEGER PRIMARY KEY,\n  ${0}\n);',
        'join': 'SELECT *\nFROM ${a}\nJOIN ${b} ON ${a}.${key} = ${b}.${key}\nWHERE ${cond};',
      },
    },
    'JSON': {
      keywords: ['true','false','null'],
      builtins: ['"id":','"name":','"type":','"value":','"data":','"items":[]','"status":','"message":','"createdAt":','"updatedAt":'],
      snippets: {
        'obj': '{\n  "${0}": \n}',
        'arr': '[\n  ${0}\n]',
        'item': '{\n  "id": 1,\n  "name": "${0}"\n}',
      },
    },
    'Markdown': {
      keywords: ['#','##','###','####','-','1.','*','**','`','>','[link](url)','![alt](img)'],
      builtins: ['**bold**','*italic*','`code`','[text](url)','![alt](image)','- item','1. item','> quote','```code```'],
      snippets: {
        'heading': '## ${0}',
        'link': '[${text}](${url})',
        'code': '```${lang}\n${0}\n```',
      },
    },
    'Shell': {
      keywords: ['echo','if','then','else','elif','fi','for','while','until','do','done','case','esac','function','return','exit','export','local','readonly','cd','ls','mkdir','rm','cp','mv','cat','touch','chmod','grep','sed','awk','find','curl','wget','git','node','npm','sudo','true','false','source','alias','set','unset'],
      builtins: ['$HOME','$PATH','$USER','$PWD','$0','$1','$@','$?','$#','$(command)','`command`','2>&1','> file','>> file','|'],
      snippets: {
        'if': 'if [ ${cond} ]; then\n  ${0}\nfi',
        'for': 'for ${i} in ${items}; do\n  ${0}\ndone',
        'fn': '${name}() {\n  ${0}\n}',
        'echo': 'echo "${0}"',
      },
    },
    'Go': {
      keywords: ['package','import','func','return','if','else','for','range','switch','case','break','continue','var','const','type','struct','interface','map','chan','go','defer','select','nil','true','false','make','len','cap','append','new'],
      builtins: ['fmt.Println','fmt.Printf','fmt.Sprintf','strings.Join','strings.Split','strconv.Atoi','strconv.Itoa','time.Now','os.Open','os.ReadFile','io.ReadAll','json.Marshal','json.Unmarshal','http.Get','error','any'],
      snippets: {
        'main': 'package main\n\nimport "fmt"\n\nfunc main() {\n\t${0}\n}',
        'fn': 'func ${name}(${params}) ${ret} {\n\t${0}\n}',
        'for': 'for i := 0; i < ${n}; i++ {\n\t${0}\n}',
        'range': 'for ${i}, ${v} := range ${items} {\n\t${0}\n}',
        'iferr': 'if err != nil {\n\treturn err\n}',
      },
    },
    'Rust': {
      keywords: ['fn','let','mut','const','static','return','if','else','for','while','loop','match','struct','enum','impl','trait','use','mod','pub','crate','self','Self','super','where','as','in','ref','move','async','await','dyn','true','false','Option','Result','Some','None','Ok','Err'],
      builtins: ['println!','print!','eprintln!','format!','vec!','String::from','format!','vec!','iter','collect','unwrap','expect','map','filter','fold','clone','to_string','as_str','push','len','is_empty'],
      snippets: {
        'main': 'fn main() {\n    ${0}\n}',
        'fn': 'fn ${name}(${params}) -> ${ret} {\n    ${0}\n}',
        'for': 'for ${i} in 0..${n} {\n    ${0}\n}',
        'match': 'match ${val} {\n    ${pat} => {\n        ${0}\n    }\n    _ => {}\n}',
        'impl': 'impl ${Type} {\n    pub fn ${new}() -> Self {\n        ${0}\n    }\n}',
      },
    },
    'Java': {
      keywords: ['public','private','protected','static','final','class','interface','extends','implements','void','int','long','double','float','boolean','char','byte','short','String','return','if','else','for','while','do','switch','case','break','continue','new','this','super','null','true','false','try','catch','finally','throw','throws','import','package','enum','record','var','abstract'],
      builtins: ['System.out.println','System.out.print','System.err.println','Math.max','Math.min','Math.abs','Math.pow','Math.sqrt','Math.random','String.format','String.valueOf','Integer.parseInt','Integer.toString','List.of','Arrays.asList','ArrayList','HashMap','HashSet','Objects.equals','StringBuilder','Thread.sleep','Exception','RuntimeException'],
      snippets: {
        'main': 'public static void main(String[] args) {\n  ${0}\n}',
        'class': 'public class ${Name} {\n  ${0}\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'sop': 'System.out.println(${0});',
        'try': 'try {\n  ${0}\n} catch (Exception e) {\n  e.printStackTrace();\n}',
      },
    },
    'PHP': {
      keywords: ['function','return','if','else','elseif','for','foreach','while','switch','case','break','continue','class','public','private','protected','static','extends','implements','interface','new','this','self','parent','namespace','use','require','require_once','include','include_once','echo','print','true','false','null','isset','empty','unset','array','as','=>','try','catch','finally','throw','match','fn','var','global','const','abstract','final','readonly','enum'],
      builtins: ['$_GET','$_POST','$_SERVER','$_SESSION','$_COOKIE','$_FILES','$this','array_map','array_filter','count','strlen','str_replace','explode','implode','json_encode','json_decode','file_get_contents','file_put_contents','mysqli','PDO','header','die','exit','var_dump','print_r'],
      snippets: {
        'php': '<?php\n${0}\n?>',
        'fn': 'function ${name}(${params}) {\n  ${0}\n}',
        'foreach': 'foreach (${items} as ${key} => ${value}) {\n  ${0}\n}',
        'echo': 'echo ${0};',
      },
    },
    'Swift': {
      keywords: ['let','var','func','return','if','else','guard','for','while','repeat','switch','case','break','continue','class','struct','enum','protocol','extension','init','deinit','static','override','import','public','private','internal','fileprivate','open','self','super','nil','true','false','throw','throws','try','catch','async','await','actor','in','as','is','where'],
      builtins: ['print','String','Int','Double','Float','Bool','Array','Dictionary','Set','Optional','map','filter','reduce','compactMap','flatMap','sorted','joined','split','lowercased','uppercased','count','isEmpty','append','removeAll','first','last','min','max','abs','round','Date','UUID','DispatchQueue.main.async'],
      snippets: {
        'main': 'import Foundation\n\nfunc main() {\n  ${0}\n}\nmain()',
        'func': 'func ${name}(${params}) -> ${ret} {\n  ${0}\n}',
        'class': 'class ${Name} {\n  ${0}\n}',
        'if': 'if ${cond} {\n  ${0}\n}',
        'for': 'for ${item} in ${items} {\n  ${0}\n}',
      },
    },
    'Kotlin': {
      keywords: ['fun','val','var','class','object','interface','data','sealed','enum','companion','init','constructor','return','if','else','when','for','while','do','break','continue','true','false','null','is','in','as','try','catch','finally','throw','import','package','public','private','protected','internal','override','open','abstract','suspend','async','await','by','get','set','lateinit'],
      builtins: ['println','print','String','Int','Long','Double','Float','Boolean','Char','Array','List','MutableList','Map','MutableMap','Set','Pair','Triple','Any','Unit','Nothing','map','filter','forEach','sorted','joinToString','firstOrNull','lastOrNull','take','drop','repeat','require','check','error','TODO'],
      snippets: {
        'main': 'fun main() {\n  ${0}\n}',
        'fun': 'fun ${name}(${params}): ${ret} {\n  ${0}\n}',
        'class': 'class ${Name}(${params}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'when': 'when (${value}) {\n  ${case} -> {\n    ${0}\n  }\n  else -> {}\n}',
      },
    },
    'Dart': {
      keywords: ['void','var','final','const','class','extends','implements','mixin','abstract','enum','return','if','else','for','while','do','switch','case','break','continue','true','false','null','this','super','new','import','export','part','library','typedef','Function','dynamic','is','as','in','try','catch','finally','throw','async','await','yield','get','set','static','late','required','factory'],
      builtins: ['print','String','int','double','num','bool','List','Map','Set','Iterable','Future','Stream','Object','dynamic','map','where','forEach','toList','join','split','length','isEmpty','add','remove','contains','first','last','isEmpty','isNotEmpty','toString','toInt','toDouble','DateTime.now','Duration','Timer','Uri','jsonDecode','jsonEncode'],
      snippets: {
        'main': 'void main() {\n  ${0}\n}',
        'fn': '${ret} ${name}(${params}) {\n  ${0}\n}',
        'class': 'class ${Name} {\n  ${Name}(this.${field});\n\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'for': 'for (var i = 0; i < ${n}; i++) {\n  ${0}\n}',
      },
    },
    'Ruby': {
      keywords: ['def','end','class','module','return','if','unless','else','elsif','case','when','while','until','for','do','begin','rescue','ensure','raise','yield','self','super','true','false','nil','and','or','not','require','require_relative','include','extend','attr_reader','attr_writer','attr_accessor','new','puts','print','each','map','select','reject'],
      builtins: ['puts','print','p','gets','Array','Hash','String','Integer','Float','Symbol','Range','Object','Time','File.open','File.read','File.write','Dir.glob','JSON.parse','JSON.generate','puts "#{}"','each_with_index','select','map','inject','reduce','include?','empty?','length','size','join','split','chomp','to_s','to_i','to_f','to_sym'],
      snippets: {
        'def': 'def ${name}(${params})\n  ${0}\nend',
        'class': 'class ${Name}\n  ${0}\nend',
        'each': '${items}.each do |${item}|\n  ${0}\nend',
        'if': 'if ${cond}\n  ${0}\nend',
      },
    },
  },

  suggest(filename, prefix, docWords) {
    const lang = LanguageDetector.detect(filename).name;
    const key = this.aliases[lang] || lang;
    const data = this.data[key];
    const out = [];
    const seen = new Set();
    const p = prefix.toLowerCase();
    const push = (label, insert, kind) => {
      if (seen.has(label) || !label) return;
      if (!label.toLowerCase().startsWith(p)) return;
      seen.add(label);
      out.push({ label, insert: insert !== undefined ? insert : label, kind });
    };
    if (data) {
      (data.keywords || []).forEach(k => push(k, k, 'kw'));
      (data.builtins || []).forEach(b => push(b, b, 'bi'));
      Object.entries(data.snippets || {}).forEach(([k, tpl]) => push(k, tpl, 'sn'));
    }
    // contextual: identifiers already used in this document
    const kwSet = new Set(data ? data.keywords : []);
    if (docWords) {
      docWords.forEach(w => {
        if (w.length > 1 && !kwSet.has(w) && !/^\d+$/.test(w)) push(w, w, 'id');
      });
    }
    if (out.length === 0) return out;
    const rank = { sn: 0, kw: 1, id: 2, bi: 3 };
    out.sort((a, b) => {
      const ae = a.label.toLowerCase() === p ? 0 : a.label.toLowerCase().startsWith(p) ? 1 : 2;
      const be = b.label.toLowerCase() === p ? 0 : b.label.toLowerCase().startsWith(p) ? 1 : 2;
      if (ae !== be) return ae - be;
      if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
      if (a.label.length !== b.label.length) return a.label.length - b.label.length;
      return a.label.localeCompare(b.label);
    });
    return out.slice(0, 14);
  },
};

// ============================================================
// AutocompleteBox — the floating dropdown UI
// ============================================================

class AutocompleteBox {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ac-box';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
    this.items = [];
    this.active = -1;
    this.ctx = null;
    this._onClick = (e) => {
      const li = e.target.closest('.ac-item');
      if (li) this.accept(parseInt(li.dataset.i, 10));
    };
    this.el.addEventListener('mousedown', (e) => e.preventDefault()); // keep textarea focus
    this.el.addEventListener('click', this._onClick);
  }

  isOpen() { return this.el.style.display !== 'none'; }

  show(ctx) {
    this.ctx = ctx;
    this.items = ctx.suggestions;
    this.active = 0;
    this._render();
    this.el.style.display = 'block';
    this._position(ctx.editor);
  }

  close() {
    if (!this.isOpen()) return;
    this.el.style.display = 'none';
    this.items = [];
    this.ctx = null;
    this.active = -1;
  }

  next() {
    if (!this.items.length) return;
    this.active = (this.active + 1) % this.items.length;
    this._highlightActive();
  }

  prev() {
    if (!this.items.length) return;
    this.active = (this.active - 1 + this.items.length) % this.items.length;
    this._highlightActive();
  }

  accept(index) {
    if (!this.ctx) return;
    const i = index !== undefined ? index : this.active;
    const item = this.items[i];
    if (!item) { this.close(); return; }
    const { editor, prefix } = this.ctx;
    const ta = editor.textarea;
    const pos = ta.selectionStart;
    const start = pos - prefix.length;
    const rest = ta.value.slice(pos);
    const insert = item.insert;
    const ph = insert.indexOf('${0}');
    let out, cursor;
    if (ph !== -1) {
      out = insert.slice(0, ph) + insert.slice(ph + 4).replace(/\$\{\d+\}/g, '');
      cursor = start + ph;
    } else {
      out = insert;
      cursor = start + out.length;
    }
    ta.value = ta.value.slice(0, start) + out + rest;
    ta.selectionStart = ta.selectionEnd = cursor;
    editor.content = ta.value;
    editor._updateHighlight();
    editor._updateLineNumbers();
    editor._emit('change', editor.content);
    this.close();
    ta.focus();
  }

  _render() {
    this.el.innerHTML = '';
    this.items.forEach((item, i) => {
      const li = document.createElement('div');
      li.className = 'ac-item' + (i === this.active ? ' active' : '');
      li.dataset.i = i;
      const kind = document.createElement('span');
      kind.className = 'ac-kind';
      kind.textContent = { sn: 'SNIP', kw: 'KEY', id: 'VAR', bi: 'API' }[item.kind] || 'KEY';
      const label = document.createElement('span');
      label.className = 'ac-label';
      label.textContent = item.label;
      li.appendChild(kind);
      li.appendChild(label);
      this.el.appendChild(li);
    });
  }

  _highlightActive() {
    const items = this.el.querySelectorAll('.ac-item');
    items.forEach((li, i) => li.classList.toggle('active', i === this.active));
    const act = items[this.active];
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  _position(editor) {
    const ta = editor.textarea;
    const cs = getComputedStyle(ta);
    const mirror = document.createElement('div');
    mirror.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;white-space:pre;';
    ['fontFamily','fontSize','fontWeight','fontStyle','fontVariant','letterSpacing','wordSpacing','lineHeight','textIndent','textTransform','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing','tabSize'].forEach(p => mirror.style[p] = cs[p]);
    const pre = document.createElement('pre');
    pre.textContent = ta.value.slice(0, ta.selectionStart).replace(/\r\n/g, '\n').replace(/\n/g, '\u200b');
    const span = document.createElement('span');
    span.textContent = 'x';
    pre.appendChild(span);
    mirror.appendChild(pre);
    document.body.appendChild(mirror);
    const caret = span.getBoundingClientRect();
    document.body.removeChild(mirror);

    const box = this.el.getBoundingClientRect();
    let left = caret.left;
    const maxLeft = window.innerWidth - box.width - 8;
    left = Math.max(8, Math.min(left, Math.max(8, maxLeft)));
    let top = caret.bottom + 4;
    if (top + box.height > window.innerHeight - 8) top = Math.max(8, caret.top - box.height - 4);
    this.el.style.left = left + 'px';
    this.el.style.top = top + 'px';
  }
}

// ============================================================
// Problem Detector — finds bugs as you type
// ============================================================

const Problems = {
  check(code, filename) {
    if (!code || !code.trim()) return [];
    const lang = LanguageDetector.detect(filename).name;
    const cfg = this._cfgFor(lang);
    let problems = this._scan(code, cfg);
    if (lang === 'Python') this._checkPython(code, problems);
    else if (lang === 'JSON') this._checkJSON(code, problems);
    else if (lang === 'HTML' || lang === 'XML' || lang === 'SVG' || lang === 'Vue') this._checkTags(code, problems);
    else if (lang === 'JavaScript' || lang === 'TypeScript' || lang === 'JSX' || lang === 'TSX') this._checkJS(code, problems);
    // dedupe
    const seen = new Set();
    problems = problems.filter(p => {
      const k = p.line + ':' + p.col + ':' + p.message;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    problems.sort((a, b) => a.line - b.line || a.col - b.col);
    return problems;
  },

  _cfgFor(lang) {
    if (lang === 'Python' || lang === 'Ruby' || lang === 'Shell' || lang === 'YAML' || lang === 'TOML') return { line: ['#'], block: [] };
    if (lang === 'SQL') return { line: ['--'], block: [['/*', '*/']] };
    if (lang === 'HTML' || lang === 'XML' || lang === 'SVG' || lang === 'Vue') return { line: [], block: [['<!--', '-->']] };
    return { line: ['//'], block: [['/*', '*/']] };
  },

  _lineOf(code, index) { return code.slice(0, index).split('\n').length; },
  _colOf(code, index) { const b = code.slice(0, index); return index - b.lastIndexOf('\n'); },

  _scan(code, cfg) {
    const problems = [];
    const stack = [];
    const lineMarks = cfg.line;
    const blockMarks = cfg.block;
    let line = 1, col = 0;
    let inStr = null, inLine = null, inBlock = null;
    let i = 0;
    const n = code.length;
    const isQuote = (c) => c === '"' || c === "'" || c === '`';
    while (i < n) {
      const c = code[i];
      if (c === '\n') { line++; col = 0; } else col++;

      if (inLine) { if (c === '\n') inLine = null; i++; continue; }
      if (inBlock) {
        if (code.startsWith(inBlock, i)) { inBlock = null; i += inBlock.length; continue; }
        i++; continue;
      }
      if (inStr) {
        if (c === '\\') { i += 2; continue; }
        if (inStr.length > 1) {
          if (code.startsWith(inStr, i)) { inStr = null; i += inStr.length; continue; }
        } else if (c === inStr) { inStr = null; i++; continue; }
        i++; continue;
      }

      let matched = false;
      for (const mk of lineMarks) {
        if (code.startsWith(mk, i)) { inLine = mk; i += mk.length; matched = true; break; }
      }
      if (matched) continue;
      for (const bm of blockMarks) {
        if (code.startsWith(bm[0], i)) { inBlock = bm[1]; i += bm[0].length; matched = true; break; }
      }
      if (matched) continue;

      if (isQuote(c)) {
        if (c === '"' && code.startsWith('"""', i)) { inStr = '"""'; i += 3; continue; }
        if (c === "'" && code.startsWith("'''", i)) { inStr = "'''"; i += 3; continue; }
        inStr = c; i++; continue;
      }
      if (c === ')' || c === ']' || c === '}') {
        const want = c === ')' ? '(' : c === ']' ? '[' : '{';
        if (stack.length && stack[stack.length - 1].ch === want) stack.pop();
        else problems.push({ line, col, severity: 'error', message: `Unmatched '${c}'` });
      } else if (c === '(' || c === '[' || c === '{') {
        stack.push({ ch: c, line, col });
      }
      i++;
    }
    if (inStr) problems.push({ line, col: col + 1, severity: 'error', message: `Unterminated string — missing closing ${inStr.length > 1 ? 'triple quote' : inStr}` });
    if (inBlock) problems.push({ line, col, severity: 'error', message: 'Unclosed block comment — missing closing marker' });
    stack.forEach(s => problems.push({ line: s.line, col: s.col, severity: 'warning', message: `Unclosed '${s.ch}'` }));
    return problems;
  },

  _checkPython(code, problems) {
    const lines = code.split('\n');
    lines.forEach((ln, idx) => {
      const indent = ln.match(/^[ \t]+/);
      if (indent && indent[0].includes(' ') && indent[0].includes('\t')) {
        problems.push({ line: idx + 1, col: 1, severity: 'warning', message: 'Mixed tabs and spaces in indentation' });
      }
      const t = ln.trim().replace(/#.*$/, '').trimEnd();
      if (!t) return;
      const m = t.match(/^(def|class|if|elif|else|for|while|try|except|finally|with|match|case)\b/);
      if (m && !t.endsWith(':')) {
        problems.push({ line: idx + 1, col: 1, severity: 'warning', message: `${m[1]} block is missing a trailing ':'` });
      }
    });
  },

  _checkJSON(code, problems) {
    try { JSON.parse(code); }
    catch (e) {
      const m = String(e.message).match(/position (\d+)/);
      let line = 1, col = 1;
      if (m) {
        const pos = parseInt(m[1], 10);
        const before = code.slice(0, pos);
        line = before.split('\n').length;
        col = pos - before.lastIndexOf('\n');
      }
      problems.push({ line, col: Math.max(1, col), severity: 'error', message: 'Invalid JSON — ' + e.message });
    }
  },

  _voidTags: new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']),

  _checkTags(code, problems) {
    const src = code.replace(/<!--[\s\S]*?-->/g, '');
    const stack = [];
    const re = /<\/?([a-zA-Z][\w-]*)(?:\s[^>]*)?\/?>/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const full = m[0];
      if (/^<\/?[!?]/.test(full)) continue;
      const name = m[1].toLowerCase();
      const ln = this._lineOf(src, m.index);
      const cl = this._colOf(src, m.index);
      if (full.startsWith('</')) {
        const open = stack.pop();
        if (open && open.name !== name) problems.push({ line: ln, col: cl, severity: 'warning', message: `Closing '</${name}>' does not match '<${open.name}>'` });
        else if (!open) problems.push({ line: ln, col: cl, severity: 'warning', message: `Unexpected closing tag '</${name}>'` });
      } else if (!full.endsWith('/>')) {
        if (!this._voidTags.has(name)) stack.push({ name, line: ln, col: cl });
      }
    }
    stack.forEach(s => problems.push({ line: s.line, col: s.col, severity: 'warning', message: `Unclosed tag '<${s.name}>'` }));
  },

  _checkJS(code, problems) {
    const re = /console\.(log|debug)\s*\(/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      problems.push({ line: this._lineOf(code, m.index), col: this._colOf(code, m.index), severity: 'info', message: `console.${m[1]}() left in code` });
    }
    const dbg = /\bdebugger\b/g;
    while ((m = dbg.exec(code)) !== null) {
      problems.push({ line: this._lineOf(code, m.index), col: this._colOf(code, m.index), severity: 'info', message: 'debugger statement left in code' });
    }
  },
};
