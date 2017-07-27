import filters from "./filters"
import Fs from "@ecmal/node/fs"


const OPTIONS = {
    open    : '<%',
    close   : '%>',
    cache   : {},
    filters : filters,
    escape(html){
        return String(html)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    },
    readFile(path,enc){
        return Fs.readFileSync(path,'utf8');
    },
    resolveFile(path,base){
        return Fs.resolve(Fs.dirname(base),path)
    }
};
function rethrow(err, str, filename, lineno){
    var lines = str.split('\n')
        , start = Math.max(lineno - 3, 0)
        , end = Math.min(lines.length, lineno + 3);

    // Error context
    var context = lines.slice(start, end).map(function(line, i){
        var curr = i + start + 1;
        return (curr == lineno ? ' >> ' : '    ')
            + curr
            + '| '
            + line;
    }).join('\n');

    // Alter exception message
    err.path = filename;
    err.message = (filename || 'ejs') + ':'
        + lineno + '\n'
        + context + '\n\n'
        + err.message;

    throw err;
}
export class EJS {
    public flush(){
        OPTIONS.cache = {};
    }
    public filtered(js) {
        return js.substr(1).split('|').reduce(function(js, filter){
            var parts = filter.split(':')
                , name = parts.shift()
                , args = parts.join(':') || '';
            if (args) args = ', ' + args;
            return 'filters.' + name + '(' + js + args + ')';
        });
    }
    public parse(str, options?){
        var options = options || {}
            , open = options.open || OPTIONS.open || '<%'
            , close = options.close || OPTIONS.close || '%>'
            , filename = options.filename || 'template.ejs'
            , compileDebug = options.compileDebug !== false
            , buf = "";

        buf += 'var buf = [];';
        if (false !== options._with) buf += '\nwith (locals || {}) { (function(){ ';
        buf += '\n buf.push(\'';

        var lineno = 1;

        var consumeEOL = false;
        for (var i = 0, len = str.length; i < len; ++i) {
            var stri = str[i];
            if (str.slice(i, open.length + i) == open) {
                i += open.length;

                var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
                switch (str[i]) {
                    case '-':
                        prefix = "', escape((" + line + ', ';
                        postfix = ")), '";
                        ++i;
                        break;
                    case '=':
                        prefix = "', (" + line + ', ';
                        postfix = "), '";
                        ++i;
                        break;
                    default:
                        prefix = "');" + line + ';';
                        postfix = "; buf.push('";
                }

                var end = str.indexOf(close, i);

                if (end < 0){
                    throw new Error('Could not find matching close tag "' + close + '".');
                }

                var js = str.substring(i, end)
                    , start = i
                    , include = null
                    , n = 0;

                if ('-' == js[js.length-1]){
                    js = js.substring(0, js.length - 2);
                    consumeEOL = true;
                }

                if (0 == js.trim().indexOf('include')) {
                    var name = js.trim().slice(7).trim();
                    if (!filename) {
                        throw new Error('filename option is required for includes');
                    }
                    var path = OPTIONS.resolveFile(name, filename);
                    include = OPTIONS.readFile(path, 'utf8');
                    include = this.parse(include, {
                        filename: path,
                        _with: false,
                        open: open,
                        close: close,
                        compileDebug: compileDebug
                    });
                    buf += "' + (function(){" + include + "})() + '";
                    js = '';
                }

                while (~(n = js.indexOf("\n", n))){
                    n++;
                    lineno++;
                }

                switch(js.substr(0, 1)) {
                    case ':':
                        js = this.filtered(js);
                        break;
                    case '%':
                        js = " buf.push('<%" + js.substring(1).replace(/'/g, "\\'") + "%>');";
                        break;
                    case '#':
                        js = "";
                        break;
                }

                if (js) {
                    if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
                    buf += prefix;
                    buf += js;
                    buf += postfix;
                }
                i += end - start + close.length - 1;

            } else if (stri == "\\") {
                buf += "\\\\";
            } else if (stri == "'") {
                buf += "\\'";
            } else if (stri == "\r") {
                // ignore
            } else if (stri == "\n") {
                if (consumeEOL) {
                    consumeEOL = false;
                } else {
                    buf += "\\n";
                    lineno++;
                }
            } else {
                buf += stri;
            }
        }

        if (false !== options._with) buf += "'); })();\n} \nreturn buf.join('');";
        else buf += "');\nreturn buf.join('');";
        return buf;
    }
    public compile(str, options?){
        options = options || {};
        var escape = options.escape || OPTIONS.escape;

        var input = JSON.stringify(str)
            , compileDebug = options.compileDebug !== false
            , client = options.client
            , filename = options.filename
            ? JSON.stringify(options.filename)
            : 'undefined';

        if (compileDebug) {
            // Adds the fancy stack trace meta info
            str = [
                'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
                //rethrow.toString(),
                'try {',
                this.parse(str, options),
                '} catch (err) {',
                '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
                '}'
            ].join("\n");
        } else {
            str = this.parse(str, options);
        }

        if (options.debug) console.log(str);
        if (client) str = 'escape = escape || ' + escape.toString() + ';\n' + str;

        try {
            var fn = new Function('locals, filters, escape, rethrow', str);
        } catch (err) {
            if ('SyntaxError' == err.name) {
                err.message += options.filename
                    ? ' in ' + filename
                    : ' while compiling ejs';
            }
            throw err;
        }



        if (client) return fn;
        Object.defineProperty(this,'renderer',{
            configurable    : true,
            value           : function(locals){
                return fn.call(this, locals, OPTIONS.filters, escape, rethrow);
            }
        });
        return this['renderer'];
    }
    public render(options,str?){
        var fn = this['renderer'];
        if(str){
            options = options || {};
            if (options.cache) {
                if (options.filename) {
                    fn = OPTIONS.cache[options.filename] || (OPTIONS.cache[options.filename] = this.compile(str, options));
                } else {
                    throw new Error('"cache" option requires "filename".');
                }
            } else {
                fn = this.compile(str, options);
            }
            options.__proto__ = options.locals;
        }
        return fn.call(options.scope, options);
    }
    public constructor(template?,options?){
        if(template){
            this.compile(template,options);
        }
    }
}
