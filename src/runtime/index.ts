/** @internal */
declare const window, document, XMLHttpRequest;

/** @internal */
declare const __filename, __dirname, process, global;

var System:System = Object.create({
    register(id: string | Module, requires?: string[], definer?: ModuleDefiner) {
        this.id = id;
        this.definer = definer;
        definer(null, this);
        return this;
    }
});

System.register("@ecmal/runtime", [], (exporter, module) => {
    "use strict";
    let globals, pending: any[];
    let runtime: RuntimePlatform;
    let options: Dictionary<{
        loaded: boolean;
        defined: boolean;
        definer: ModuleDefiner;
    }> = Object.create(null);
    let sources: Dictionary<string> = Object.create(null);
    let current = {
        id: module.id,
        pid: module.id,
        url: module.url,
    }
    class RuntimePlatform {
        public main;
        public get sep() { return '/' }
        public filename(path: String) {
            return path.split(this.sep).pop();
        }
        public dirname(path) {
            path = path.split('/');
            path.pop();
            path = path.join('/');
            return path;
        }
        public normalize(path) {
            if (!path || path === '/') {
                return '/';
            }
            var prepend = (path[0] == '/' || path[0] == '.');
            var target = [], src, scheme, parts, token;
            if (path.indexOf('://') > 0) {
                parts = path.split('://');
                scheme = parts[0];
                src = parts[1].split('/');
            } else {
                src = path.split('/');
            }
            for (var i = 0; i < src.length; ++i) {
                token = src[i];
                if (token === '..') {
                    target.pop();
                } else if (token !== '' && token !== '.') {
                    target.push(token);
                }
            }
            return (
                (scheme ? scheme + '://' : '') +
                (prepend ? '/' : '') +
                target.join('/').replace(/[\/]{2,}/g, '/')
            );
        }
        public resolve(...paths) {
            var current = paths.shift();
            for (let path, p = 0; p < paths.length; p++) {
                path = paths[p];
                if (path[0] == '/') {
                    current = path;
                } else {
                    current = this.normalize(current + '/' + path)
                }
            }
            return current;
        }
        public execute() {
            if (module.url != '~') {
                sources[module.url] = this.readTextFile(module.url);
            }
        }
        public moduleUrl(base, id) {
            return this.resolve(base, id + '.js');
        }
        public moduleId(base, url) {
            return url.replace(base + '/', '').replace(/^(.*)\.js$/g, '$1')
        }
        public readScript(url: string) {
            if (!sources[url]) {
                sources[url] = this.readTextFile(url);
            }
            return sources[url];
        }
        async loadScript(url: string) {
            if (!sources[url]) {
                sources[url] = await this.loadTextFile(url);
            }
            return sources[url];
        }
        public evalScript(url: string, content: string): Module {
            throw new Error('evalScript is abstract method')
        }
        public readTextFile(url: string): string {
            return null;
        }
        public loadTextFile(url: string): Promise<string> {
            return null;
        }
    }
    class RuntimeBackendPlatform extends RuntimePlatform {
        constructor() {
            super()
        }
        public evalScript(url: string, content: string) {
            return require('vm').runInThisContext(content, {
                filename: url,
            });
        }
        public readTextFile(url: string): string {
            try {
                return require('fs').readFileSync(url, 'utf8');
            } catch (ex) {
                throw new Error(`failed to read ${url}`)
            }
        }
        public loadTextFile(url: string): Promise<string> {
            return new Promise((accept, reject) => {
                try {
                    accept(require('fs').readFileSync(url, 'utf8'));
                } catch (ex) {
                    reject(reject(new Error(`failed to read ${url}`)));
                }
            });
        }
    }
    class RuntimeFrontendPlatform extends RuntimePlatform {
        constructor() {
            super()
        }
        readTextFile(url: string): string {
            try {
                var oReq = new XMLHttpRequest();
                oReq.open("GET", url, false);
                oReq.send(null);
                if (oReq.status === 200) {
                    return oReq.responseText
                } else {
                    throw new Error(`request failed with status ${oReq.status}`);
                }
            } catch (ex) {
                throw new Error(`failed to read ${url}`)
            }
        }
        loadTextFile(url: string): Promise<string> {
            return new Promise((accept, reject) => {
                var oReq = new XMLHttpRequest();
                oReq.addEventListener("load", () => {
                    accept(oReq.responseText);
                });
                oReq.addEventListener("error", () => {
                    reject(new Error(`failed to read ${url}`))
                });
                oReq.open("GET", url);
                oReq.send();
            });
        }
        public evalScript(url: string, content: string): any {
            return eval(`${content}\n//# sourceURL=${url}`);
        }
        public execute() {
            if (module.url != '~') {
                this.loadTextFile(module.url).then(r => {
                    sources[module.url] = r;
                });
            }
        }
    }
    class RuntimeModule implements Module {
        static resolve(path, parent) {
            if (path[0] == '.') {
                return runtime.resolve(runtime.dirname(parent), path);
            } else {
                return path;
            }
        }
        static new(id: string, parent: RuntimeModule): RuntimeModule {
            id = RuntimeModule.resolve(id, parent.id);
            if (!System.modules.has(id)) {
                System.modules.add(new RuntimeModule(id, parent));
            }
            return System.modules.get(id) as RuntimeModule;
        }
        id: string;
        url: string;
        exports?: any;
        requires?: string[];
        parent: Module;
        get map() {
            let parts = this.source.match(/^\/\/#\s*sourceMappingURL\s*=\s*(.*)$/m)
            if(parts && parts.length==2){
                let dirname = runtime.dirname(this.url);
                let filename = runtime.resolve(dirname,parts[1])
                let mapping = JSON.parse(runtime.readTextFile(filename))
                let sourceRoot = runtime.resolve(runtime.dirname(filename),mapping.sourceRoot)
                mapping.sourceRoot = sourceRoot;
                mapping.sourcesContent = [];
                mapping.sources.forEach((s,i,a)=>{
                    let file = runtime.resolve(sourceRoot,s)
                    mapping.sourcesContent[i] = runtime.readTextFile(file);
                })
                return mapping;
            }            
        }
        get source() {
            return sources[this.url];
        }
        constructor(id?: string, parent?: Module) {
            if (id && parent) {
                this.id = id;
                this.parent = parent;
                this.url = runtime.moduleUrl(System.root, id);
                options[this.id] = {
                    loaded: false,
                    defined: false,
                    definer: void 0
                }
            }
        }
        resource(kind: string, type: string, data: string): Resource {
            return { kind, type, data };
        }
        require(id: string) {
            let module = RuntimeModule.new(id, this);
            if (!module.exports) {
                if (!options[module.id].definer) {
                    module.read();
                }
                module.execute();
            }
            return module.exports;
        }
        read(): this {
            if (!options[this.id].loaded) {
                options[this.id].loaded = true;
                let script = runtime.readScript(this.url);
                let parent = current;
                current = { id: this.id, url: this.url, pid: parent.id };
                runtime.evalScript(this.url, script);
                current = parent;
                if (this.requires && this.requires.length) {
                    this.requires.forEach((id) => {
                        RuntimeModule.new(id, this).read()
                    })
                }
            }
            return this;
        }
        async import(id: string) {
            let module = RuntimeModule.new(id, this);
            if (!module.exports) {
                await module.load();
                module.execute();
            }
            return module.exports;
        }
        async load() {
            if (!options[this.id].loaded) {
                options[this.id].loaded = true;
                let script = await runtime.loadScript(this.url);
                let parent = current;
                current = { id: this.id, url: this.url, pid: parent.id };
                runtime.evalScript(this.url, script);
                current = parent;
                if (this.requires && this.requires.length) {
                    await Promise.all(this.requires.map((id) => {
                        return RuntimeModule.new(id, this).load();
                    }))
                }
            }
            return this;
        }
        private execute() {
            if (!options[this.id].defined) {
                options[this.id].defined = true;
                let definer = options[this.id].definer;
                this.exports = Object.create(null);
                let exporter = (key, value?) => {
                    if (typeof key == 'string') {
                        this.exports[key] = value;
                    } else {
                        Object.assign(this.exports, key);
                    }
                }
                let executor;
                if (System.platform == 'web') {
                    executor = definer(exporter, this, this.require, this.exports, this.url);
                } else {
                    executor = definer(exporter, this, require, this.exports, __filename, __dirname);
                }

                if (executor) {
                    executor.setters.forEach((setter, i) => {
                        setter(RuntimeModule.new(this.requires[i], this).execute())
                    })
                    executor.execute();
                }
            }
            return this.exports;
        }
    }
    class RuntimeModules implements Modules {
        map<T>(condition: (m: Module) => T): T[] {
            return Object.keys(this).map(k => {
                return condition(this[k] as Module);
            })
        }
        find(condition: (m: Module) => boolean): Module {
            return this[Object.keys(this).find((k, i, a) => {
                return condition(this[k] as Module);
            })]
        }
        filter(condition: (m: Module) => boolean): Module[] {
            return Object.keys(this).filter((k, i, a) => {
                return condition(this[k] as Module);
            }).map(k => this[k])
        }
        get(id: string) {
            return this[id];
        }
        has(id: string): boolean {
            return !!this[id];
        }
        add(module: Module): this {
            if (!this[module.id]) {
                Object.defineProperty(this, module.id, {
                    enumerable: true,
                    value: module
                })
            }
            return this;
        }
    }
    class RuntimeSystem extends RuntimeModule implements System {
        platform: "app" | "web";
        url: string;
        root: string;
        modules: RuntimeModules;
        module: Module;
        constructor() {
            super();
            if (typeof global != 'undefined' && typeof process != 'undefined') {
                globals = global;
                this.url = __filename;
                this.platform = "app"
            } else if (typeof window != 'undefined') {
                globals = window;
                this.url = document.currentScript.src || '~';
                this.platform = "web"
            }
            this.modules = new RuntimeModules();
            globals.System = this;
            switch (this.platform) {
                case "web": runtime = new RuntimeFrontendPlatform(); break;
                case "app": runtime = new RuntimeBackendPlatform(); break;
            }
            this.root = this.url != '~' ? runtime.resolve(runtime.dirname(this.url), '../..') : this.url;
            this.modules.add(this);
            this.modules[this.id + '/index'] = this;
            options[this.id] = {
                defined: true,
                loaded: true,
                definer: this['definer']
            }
            delete this['definer'];
            this.exports = {
                default: System,
                __assign,
                __asyncValues,
                __extends,
                __awaiter,
                __generator,
                __decorate,
                __metadata,
                __param,
                __asyncGenerator,
                __asyncDelegator,
                __asyncIterator,
                __await,
                __values,
                __exportStar,
                __spread,
                __rest,
                __read
            };
            runtime.execute();
        }
        read(id?: string) {
            if (id) {
                return RuntimeModule.new(id, this).read();
            } else {
                return this;
            }
        }
        async load(id?: string) {
            if (id) {
                return await RuntimeModule.new(id, this).load();
            } else {
                return this;
            }
        }
        bundle(id: string) {
            let module = RuntimeModule.new(id, this);
            if (!module.exports) {
                module.read();
            }
            let ids = [];
            let src = [
                `var System = Object.create({`,
                `   register(id, requires, definer) {`,
                `       this.id = id;`,
                `       this.definer = definer;`,
                `       definer(null, this);`,
                `       return this;`,
                `   }`,
                `});`,
            ];
            let collect = (id) => {
                if (ids.indexOf(id) < 0) {
                    ids.push(id);
                    let m = this.modules[id];
                    if (m.requires) {
                        m.requires.forEach(r => collect(r));
                    }
                    let name = JSON.stringify(id);
                    let requires = JSON.stringify(this.modules[id].requires || []);
                    let definer = options[id].definer.toString();
                    src.push(`System.register(${name},${requires},${definer});`);
                }
                return src;
            }
            collect(id)
            src.push(`System.require(${JSON.stringify(id)})`);
            src.push(`//# sourceURL=${id}`);
            return src.join('\n');
        }
        register(id: string, requires?: string[], definer?: ModuleDefiner): this {
            let parent = this.modules.get(current.id);
            let module = RuntimeModule.new(id, parent);
            module.requires = requires.map(
                i => RuntimeModule.resolve(i, id)
            );
            options[module.id].definer = definer;
            options[module.id].defined = false;
            return this;
        }
    }
    function doInitRuntime() {
        (Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
        Object.setPrototypeOf(System, RuntimeSystem.prototype);
        RuntimeSystem.call(System);
    }
    function __assign(object, ...patches) {
        return Object.assign(object, ...patches);
    }
    function __exportStar(m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    function __rest(s, e) {
        var t = {};
        for (let p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (let i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)
                if (e.indexOf(p[i]) < 0)
                    t[p[i]] = s[p[i]];
        return t;
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator];
        return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }
    function __asyncIterator(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator];
        return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f?) { if (o[n]) i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
    }
    function __extends(d, b) {
        if (b) {
            Object.setPrototypeOf(d, b);
            Object.setPrototypeOf(d.prototype, b.prototype);
        }
        Object.defineProperty(d.prototype, 'constructor', {
            configurable: true,
            value: d
        });
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        return new Promise(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : new Promise(function (resolve) {
                    resolve(result.value);
                }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new (__await as any)(v);
    }
    function __generator(thisArg, body) {
        var _: any = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
        return { next: verb(0), "throw": verb(1), "return": verb(2) };
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [0, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect['decorate'] === "function") {
            r = Reflect['decorate'](decorators, target, key, desc);
        } else {
            for (var i = decorators.length - 1; i >= 0; i--) {
                if (d = decorators[i]) {
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                }
            }
        }
        return (c > 3 && r && Object.defineProperty(target, key, r), r);
    }
    function __metadata(name, value) {
        let Mirror = System.require('@ecmal/runtime/reflect').Mirror;
        return (target, key?, desc?: PropertyDescriptor) => {
            Mirror.new(target, key, desc).setMetadata(name, value);
            return desc;
        }
    }
    function __param(paramIndex, decorator) {
        return function (target, key) {
            decorator(target, key, paramIndex);
        }
    }
    function __read(o, n?) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }


    doInitRuntime();
});