system.register("elp/models/source", ["../utils/fs"], function(system,module) {
    var fs_1;
    var EXTS, Crypto;
    var Source = (function (__super) {
        Source.isResource = function (ext) {
            return ['.ts', '.d.ts', '.js', '.js.map'].indexOf(ext) < 0;
        };
        Source.getHash = function (content) {
            return Crypto.createHash('md5').update(content).digest("hex");
        };
        Source.getName = function (path) {
            var exts = Object.keys(EXTS);
            for (var _i = 0, exts_1 = exts; _i < exts_1.length; _i++) {
                var e = exts_1[_i];
                var i = path.lastIndexOf(e);
                if (i > 0 && i == path.length - e.length) {
                    return path.substring(0, i);
                }
            }
            if (path.lastIndexOf('.') > 0) {
                return path.substring(0, path.lastIndexOf('.'));
            }
            else {
                return path;
            }
        };
        Source.getExt = function (path) {
            var ext, exts = Object.keys(EXTS);
            for (var _i = 0, exts_2 = exts; _i < exts_2.length; _i++) {
                var e = exts_2[_i];
                var i = path.lastIndexOf(e);
                if (i >= 0 && i == path.length - e.length) {
                    ext = e;
                    break;
                }
            }
            if (!ext && path.lastIndexOf('.') > 0) {
                ext = path.substring(path.lastIndexOf('.'));
            }
            return ext;
        };
        Source.getType = function (path) {
            var exts = Object.keys(EXTS);
            for (var _i = 0, exts_3 = exts; _i < exts_3.length; _i++) {
                var e = exts_3[_i];
                var i = path.lastIndexOf(e);
                if (i == path.length - e.length) {
                    return EXTS[e];
                }
            }
            return 'resource';
        };
        Object.defineProperty(Source.prototype, "uri", {
            get: function () {
                return this.project + '/' + this.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "ts", {
            get: function () {
                return this.files['.ts'];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "js", {
            get: function () {
                return this.files['.js'];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "tsx", {
            get: function () {
                return this.files['.tsx'];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "tsd", {
            get: function () {
                return this.files['.d.ts'];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "map", {
            get: function () {
                return this.files['.js.map'];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "version", {
            get: function () {
                var file = (this.ts || this.tsx || this.tsd);
                if (file && file.content) {
                    return String(file.hash);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "content", {
            get: function () {
                var file = (this.ts || this.tsx || this.tsd);
                if (file && file.content) {
                    return file.content.toString();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "script", {
            get: function () {
                if (this.js) {
                    return this.js.content.toString();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "resources", {
            get: function () {
                var _this = this;
                return Object.keys(this.files).filter(function (k) { return Source.isResource(k); }).map(function (k) { return _this.files[k]; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "compilable", {
            get: function () {
                return !!(this.files['.ts'] || this.files['.tsx']);
            },
            enumerable: true,
            configurable: true
        });
        Source.prototype.cleanMap = function () {
            if (this.script) {
                return this.script.replace(/\n+\/\/#\s+sourceMappingURL=(.*)\n?/g, '').trim();
            }
        };
        Source.prototype.bundle = function (maps) {
            if (maps === void 0) { maps = false; }
            if (this.script) {
                if (this.map && this.map.content) {
                    var mapBase64 = new Buffer(this.map.content.toString()).toString('base64');
                    return this.script.replace(/\n+\/\/#\s+sourceMappingURL=(.*)\n?/g, "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + mapBase64).trim();
                }
                else {
                    return this.script.replace(/\n+\/\/#\s+sourceMappingURL=.*\n?/g, "").trim();
                }
            }
        };
        Source.prototype.mapTo = function (dir) {
            var _this = this;
            if (this.map) {
                var map = JSON.parse(this.map.content.toString());
                delete map.sourceRoot;
                map.sources = map.sources.map(function (s) {
                    return s.replace(_this.project + '/', './');
                });
                this.files['.js.map'].content = JSON.stringify(map);
            }
        };
        Source.prototype.addFile = function (file) {
            //console.info(file);
            var old = this.files[file.ext];
            if (!old) {
                old = this.files[file.ext] = {};
            }
            for (var i in file) {
                old[i] = file[i];
            }
            old.size = old.content.length;
            old.hash = Source.getHash(old.content);
        };
        Source.prototype.toString = function (full) {
            if (full === void 0) { full = false; }
            var fStr = '';
            if (full) {
                for (var f in this.files) {
                    var file = this.files[f];
                    fStr += "\n  " + [
                        file.ext,
                        file.hash,
                        file.content.length
                    ].join('\t');
                }
            }
            return "Source('" + this.uri + "'," + (this.main ? 'Y' : 'N') + ",[" + (full ? fStr + '\n' : Object.keys(this.files).join(' ')) + "])";
        };
        Source.prototype.toMetadata = function () {
            var meta = {
                name: this.name,
                version: this.version,
                size: this.js ? this.js.size : undefined,
                hash: this.js ? this.js.hash : undefined,
                files: {}
            };
            for (var ext in this.files) {
                var file = this.files[ext];
                meta.files[ext] = {
                    size: file.size,
                    hash: file.hash,
                    sha: file.sha
                };
            }
            return meta;
        };
        Source.prototype.inspect = function () {
            return this.toString();
        };
        return Source;
        function Source(project, name, main) {
            if (main === void 0) { main = true; }
            this.main = main;
            this.project = project;
            this.name = name;
            this.files = {};
        }
    })();
    module.define('class', Source);
    module.export("Source", Source);
    return {
        setters:[
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            EXTS = {
                '.d.ts': 'definition',
                '.ts': 'source',
                '.js.map': 'map',
                '.js': 'script'
            };
            Crypto = system.node.require('crypto');
            Source = module.init(Source);
        }
    }
});
//# sourceMappingURL=source.js.map