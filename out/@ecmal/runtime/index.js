var System = Object.create({
    register: function (id, requires, definer) {
        this.id = id;
        this.requires = requires;
        this.definer = definer;
        definer(null, this);
        return this;
    }
});
System.register("@ecmal/runtime", [], function (exporter, module) {
    "use strict";
    var globals, pending;
    var runtime;
    var sources = Object.create(null);
    var current = {
        id: module.id,
        pid: module.id,
        url: module.url,
    };
    var RuntimePlatform = (function () {
        function RuntimePlatform() {
            doExportLocals();
        }
        Object.defineProperty(RuntimePlatform.prototype, "sep", {
            get: function () { return '/'; },
            enumerable: true,
            configurable: true
        });
        RuntimePlatform.prototype.filename = function (path) {
            return path.split(this.sep).pop();
        };
        RuntimePlatform.prototype.dirname = function (path) {
            path = path.split('/');
            path.pop();
            path = path.join('/');
            return path;
        };
        RuntimePlatform.prototype.normalize = function (path) {
            if (!path || path === '/') {
                return '/';
            }
            var prepend = (path[0] == '/' || path[0] == '.');
            var target = [], src, scheme, parts, token;
            if (path.indexOf('://') > 0) {
                parts = path.split('://');
                scheme = parts[0];
                src = parts[1].split('/');
            }
            else {
                src = path.split('/');
            }
            for (var i = 0; i < src.length; ++i) {
                token = src[i];
                if (token === '..') {
                    target.pop();
                }
                else if (token !== '' && token !== '.') {
                    target.push(token);
                }
            }
            return ((scheme ? scheme + '://' : '') +
                (prepend ? '/' : '') +
                target.join('/').replace(/[\/]{2,}/g, '/'));
        };
        RuntimePlatform.prototype.resolve = function () {
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            var current = paths.shift();
            for (var path = void 0, p = 0; p < paths.length; p++) {
                path = paths[p];
                if (path[0] == '/') {
                    current = path;
                }
                else {
                    current = this.normalize(current + '/' + path);
                }
            }
            return current;
        };
        RuntimePlatform.prototype.execute = function () {
            sources[module.url] = this.readTextFile(module.url);
        };
        RuntimePlatform.prototype.moduleUrl = function (base, id) {
            return this.resolve(base, id + '.js');
        };
        RuntimePlatform.prototype.moduleId = function (base, url) {
            return url.replace(base + '/', '').replace(/^(.*)\.js$/g, '$1');
        };
        RuntimePlatform.prototype.readScript = function (url) {
            if (!sources[url]) {
                sources[url] = this.readTextFile(url);
            }
            return sources[url];
        };
        RuntimePlatform.prototype.loadScript = function (url) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!!sources[url]) return [3 /*break*/, 2];
                            _a = sources;
                            _b = url;
                            return [4 /*yield*/, this.loadTextFile(url)];
                        case 1:
                            _a[_b] = _c.sent();
                            _c.label = 2;
                        case 2: return [2 /*return*/, sources[url]];
                    }
                });
            });
        };
        RuntimePlatform.prototype.evalScript = function (url, content) {
            throw new Error('evalScript is abstract method');
        };
        RuntimePlatform.prototype.readTextFile = function (url) {
            return null;
        };
        RuntimePlatform.prototype.loadTextFile = function (url) {
            return null;
        };
        return RuntimePlatform;
    }());
    var RuntimeBackendPlatform = (function (_super) {
        __extends(RuntimeBackendPlatform, _super);
        function RuntimeBackendPlatform() {
            return _super.call(this) || this;
        }
        RuntimeBackendPlatform.prototype.evalScript = function (url, content) {
            return require('vm').runInThisContext(content, {
                filename: url,
            });
        };
        RuntimeBackendPlatform.prototype.readTextFile = function (url) {
            try {
                return require('fs').readFileSync(url, 'utf8');
            }
            catch (ex) {
                throw new Error("failed to read " + url);
            }
        };
        RuntimeBackendPlatform.prototype.loadTextFile = function (url) {
            return new Promise(function (accept, reject) {
                try {
                    accept(require('fs').readFileSync(url, 'utf8'));
                }
                catch (ex) {
                    reject(reject(new Error("failed to read " + url)));
                }
            });
        };
        return RuntimeBackendPlatform;
    }(RuntimePlatform));
    var RuntimeFrontendPlatform = (function (_super) {
        __extends(RuntimeFrontendPlatform, _super);
        function RuntimeFrontendPlatform() {
            return _super.call(this) || this;
        }
        RuntimeFrontendPlatform.prototype.readTextFile = function (url) {
            try {
                var oReq = new XMLHttpRequest();
                oReq.open("GET", url, false);
                oReq.send(null);
                if (oReq.status === 200) {
                    return oReq.responseText;
                }
                else {
                    throw new Error("request failed with status " + oReq.status);
                }
            }
            catch (ex) {
                throw new Error("failed to read " + url);
            }
        };
        RuntimeFrontendPlatform.prototype.loadTextFile = function (url) {
            return new Promise(function (accept, reject) {
                var oReq = new XMLHttpRequest();
                oReq.addEventListener("load", function () {
                    accept(oReq.responseText);
                });
                oReq.addEventListener("error", function () {
                    reject(new Error("failed to read " + url));
                });
                oReq.open("GET", url);
                oReq.send();
            });
        };
        RuntimeFrontendPlatform.prototype.evalScript = function (url, content) {
            return eval(content + "\n//# sourceURL=" + url);
        };
        RuntimeFrontendPlatform.prototype.execute = function () {
            this.loadTextFile(module.url).then(function (r) {
                sources[module.url] = r;
            });
        };
        return RuntimeFrontendPlatform;
    }(RuntimePlatform));
    var RuntimeModule = (function () {
        function RuntimeModule(id, parent) {
            if (id && parent) {
                this.id = id;
                this.parent = parent;
                this.url = runtime.moduleUrl(System.root, id);
                this.state = "pending";
                this.isLoaded = false;
            }
        }
        RuntimeModule.resolve = function (path, parent) {
            if (path[0] == '.') {
                return runtime.resolve(runtime.dirname(parent), path);
            }
            else {
                return path;
            }
        };
        RuntimeModule.new = function (id, parent) {
            id = RuntimeModule.resolve(id, parent.id);
            if (!System.modules.has(id)) {
                System.modules.add(new RuntimeModule(id, parent));
            }
            return System.modules.get(id);
        };
        Object.defineProperty(RuntimeModule.prototype, "source", {
            get: function () {
                return sources[this.url];
            },
            enumerable: true,
            configurable: true
        });
        RuntimeModule.prototype.require = function (id) {
            var module = RuntimeModule.new(id, this);
            module.read();
            module.execute();
            return module.exports;
        };
        RuntimeModule.prototype.read = function () {
            var _this = this;
            if (!this.isLoaded) {
                this.isLoaded = true;
                var script = runtime.readScript(this.url);
                var parent = current;
                current = { id: this.id, url: this.url, pid: parent.id };
                runtime.evalScript(this.url, script);
                current = parent;
                if (this.requires && this.requires.length) {
                    this.requires.forEach(function (id) {
                        RuntimeModule.new(id, _this).read();
                    });
                }
            }
        };
        RuntimeModule.prototype.import = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var module;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            module = RuntimeModule.new(id, this);
                            return [4 /*yield*/, module.load()];
                        case 1:
                            _a.sent();
                            module.execute();
                            return [2 /*return*/, module.exports];
                    }
                });
            });
        };
        RuntimeModule.prototype.load = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var script, parent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.isLoaded) return [3 /*break*/, 3];
                            this.isLoaded = true;
                            return [4 /*yield*/, runtime.loadScript(this.url)];
                        case 1:
                            script = _a.sent();
                            parent = current;
                            current = { id: this.id, url: this.url, pid: parent.id };
                            runtime.evalScript(this.url, script);
                            current = parent;
                            if (!(this.requires && this.requires.length)) return [3 /*break*/, 3];
                            return [4 /*yield*/, Promise.all(this.requires.map(function (id) {
                                    return RuntimeModule.new(id, _this).load();
                                }))];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        RuntimeModule.prototype.execute = function () {
            var _this = this;
            if (this.definer) {
                var definer = this.definer;
                delete this.definer;
                this.exports = Object.create(null);
                var executor = definer(function (key, value) {
                    if (typeof key == 'string') {
                        _this.exports[key] = value;
                    }
                    else {
                        Object.assign(_this.exports, key);
                    }
                }, this);
                if (executor) {
                    executor.setters.forEach(function (setter, i) {
                        setter(RuntimeModule.new(_this.requires[i], _this).execute());
                    });
                    executor.execute();
                }
            }
            return this.exports;
        };
        return RuntimeModule;
    }());
    var RuntimeModules = (function () {
        function RuntimeModules() {
        }
        RuntimeModules.prototype.map = function (condition) {
            var _this = this;
            return Object.keys(this).map(function (k) {
                return condition(_this[k]);
            });
        };
        RuntimeModules.prototype.find = function (condition) {
            var _this = this;
            return this[Object.keys(this).find(function (k, i, a) {
                return condition(_this[k]);
            })];
        };
        RuntimeModules.prototype.filter = function (condition) {
            var _this = this;
            return Object.keys(this).filter(function (k, i, a) {
                return condition(_this[k]);
            }).map(function (k) { return _this[k]; });
        };
        RuntimeModules.prototype.get = function (id) {
            return this[id];
        };
        RuntimeModules.prototype.has = function (id) {
            return !!this[id];
        };
        RuntimeModules.prototype.add = function (module) {
            if (!this[module.id]) {
                Object.defineProperty(this, module.id, {
                    enumerable: true,
                    value: module
                });
            }
            return this;
        };
        return RuntimeModules;
    }());
    var RuntimeSystem = (function (_super) {
        __extends(RuntimeSystem, _super);
        function RuntimeSystem() {
            var _this = _super.call(this) || this;
            if (typeof global != 'undefined' && typeof process != 'undefined') {
                globals = global;
                _this.url = __filename;
                _this.platform = "app";
            }
            else if (typeof window != 'undefined') {
                globals = window;
                _this.url = document.currentScript.src;
                _this.platform = "web";
            }
            _this.modules = new RuntimeModules();
            globals.System = _this;
            switch (_this.platform) {
                case "web":
                    runtime = new RuntimeFrontendPlatform();
                    break;
                case "app":
                    runtime = new RuntimeBackendPlatform();
                    break;
            }
            _this.root = runtime.resolve(runtime.dirname(_this.url), '../..');
            _this.isLoaded = true;
            _this.modules.add(_this);
            runtime.execute();
            return _this;
        }
        RuntimeSystem.prototype.require = function (id) {
            if (System.modules.has(id)) {
                return System.modules.get(id).exports;
            }
            else {
                return module.require(id);
            }
        };
        RuntimeSystem.prototype.import = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!System.modules.has(id)) return [3 /*break*/, 1];
                            return [2 /*return*/, System.modules.get(id).exports];
                        case 1: return [4 /*yield*/, module.import(id)];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        RuntimeSystem.prototype.register = function (id, requires, definer) {
            var parent = this.modules.get(current.id);
            var module = RuntimeModule.new(id, parent);
            module.requires = requires.map(function (id) { return RuntimeModule.resolve(id, parent.id); });
            module.definer = definer;
            module.state = "loaded";
            return this;
        };
        return RuntimeSystem;
    }(RuntimeModule));
    function doInitRuntime() {
        Object.setPrototypeOf(System, RuntimeSystem.prototype);
        RuntimeSystem.call(System);
    }
    function doExportLocals() {
        module.exports = {
            default: System,
            __extends: __extends,
            __awaiter: __awaiter,
            __generator: __generator,
            __decorate: __decorate,
            __metadata: __metadata,
            __param: __param,
        };
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
                }
                catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                }
                catch (e) {
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
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
        return { next: verb(0), "throw": verb(1), "return": verb(2) };
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [0, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect['decorate'] === "function") {
            r = Reflect['decorate'](decorators, target, key, desc);
        }
        else {
            for (var i = decorators.length - 1; i >= 0; i--) {
                if (d = decorators[i]) {
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                }
            }
        }
        return (c > 3 && r && Object.defineProperty(target, key, r), r);
    }
    function __metadata(name, value) {
        var Mirror = System.require('@ecmal/runtime/module');
        return function (target, key, desc) {
            Mirror.new(target, key, desc).setMetadata(name, value);
            return desc;
        };
    }
    function __param(paramIndex, decorator) {
        return function (target, key) {
            decorator(target, key, paramIndex);
        };
    }
    doInitRuntime();
});
//# sourceMappingURL=index.js.map