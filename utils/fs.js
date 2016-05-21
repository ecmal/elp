system.register("elp/utils/fs", [], function(system,module) {
    var FileSystem = (function (__super) {
        FileSystem.resolve = function () {
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i - 0] = arguments[_i];
            }
            return (_a = this.path).resolve.apply(_a, paths);
            var _a;
        };
        FileSystem.relative = function (base, path) {
            return this.path.relative(base, path);
        };
        FileSystem.basename = function (path, ext) {
            return this.path.basename(path, ext);
        };
        FileSystem.dirname = function (path) {
            return this.path.dirname(path);
        };
        FileSystem.extname = function (path) {
            return this.path.extname(path);
        };
        FileSystem.exists = function (path) {
            return this.fs.existsSync(path);
        };
        FileSystem.stats = function (path) {
            return this.fs.statSync(path);
        };
        FileSystem.isDir = function (path) {
            return this.exists(path) && this.stats(path).isDirectory();
        };
        FileSystem.isFile = function (path) {
            return this.exists(path) && this.stats(path).isFile();
        };
        FileSystem.cleanDir = function (path, filter) {
            var _this = this;
            if (this.fs.existsSync(path)) {
                var files = this.fs.readdirSync(path);
                if (filter) {
                    files = files.filter(filter);
                }
                files.forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (_this.fs.lstatSync(curPath).isDirectory()) {
                        _this.cleanDir(curPath, filter);
                    }
                    else {
                        _this.fs.unlinkSync(curPath);
                    }
                });
                if (this.fs.readdirSync(path).length == 0) {
                    this.fs.rmdirSync(path);
                }
            }
        };
        FileSystem.removeDir = function (path) {
            var _this = this;
            if (this.fs.existsSync(path)) {
                this.fs.readdirSync(path).forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (_this.fs.lstatSync(curPath).isDirectory()) {
                        _this.removeDir(curPath);
                    }
                    else {
                        _this.removeFile(curPath);
                    }
                });
                this.fs.rmdirSync(path);
            }
        };
        FileSystem.copyDir = function (fromDir, toDir) {
            var _this = this;
            this.readDir(fromDir, true).forEach(function (f) {
                var t = FileSystem.resolve(toDir, FileSystem.relative(fromDir, f));
                _this.copyFile(f, t);
            });
        };
        FileSystem.readDir = function (dir, recursive, includeDirs) {
            var _this = this;
            if (recursive === void 0) { recursive = false; }
            if (includeDirs === void 0) { includeDirs = false; }
            var items = this.fs.readdirSync(dir).map(function (s) {
                return _this.path.resolve(dir, s);
            });
            var files = [], dirs = [];
            items.forEach(function (f) {
                if (_this.fs.statSync(f).isDirectory()) {
                    dirs.push(f);
                }
                else {
                    files.push(f);
                }
            });
            if (recursive) {
                dirs.forEach(function (d) {
                    files = files.concat(_this.readDir(d, recursive));
                });
            }
            if (includeDirs) {
                files = dirs.concat(files);
            }
            return files;
        };
        FileSystem.watchDir = function (path, cb, recursive) {
            if (recursive === void 0) { recursive = true; }
            return this.fs.watch(path, { persistent: true, recursive: recursive }, cb);
        };
        FileSystem.createDir = function (path, recursive) {
            if (recursive === void 0) { recursive = false; }
            if (recursive) {
                var parts = this.path.normalize(path).split(this.path.sep);
                path = '';
                for (var i = 0; i < parts.length; i++) {
                    path += parts[i] + this.path.sep;
                    if (!this.fs.existsSync(path)) {
                        this.fs.mkdirSync(path, 0x1FD);
                    }
                }
            }
            else {
                this.fs.mkdirSync(path);
            }
        };
        FileSystem.removeFile = function (path) {
            this.fs.unlinkSync(path);
        };
        FileSystem.copyFile = function (fromPath, toPath) {
            this.writeFile(toPath, this.readFile(fromPath));
        };
        FileSystem.chmodFile = function (path, mode) {
            this.fs.chmodSync(path, parseInt(mode, 8));
        };
        FileSystem.writeFile = function (path, data) {
            var dirname = this.dirname(path);
            if (!this.exists(dirname)) {
                this.createDir(dirname, true);
            }
            if (typeof data == 'string') {
                return this.fs.writeFileSync(path, data, 'utf8');
            }
            else {
                return this.fs.writeFileSync(path, data, 'binary');
            }
        };
        FileSystem.writeJson = function (path, data) {
            return this.writeFile(path, JSON.stringify(data, null, '  ') + '\n');
        };
        FileSystem.readFile = function (path) {
            return this.fs.readFileSync(path);
        };
        FileSystem.readFileHash = function (path) {
            return this.crypto.createHash('md5').update(this.readFile(path)).digest("hex");
        };
        FileSystem.readJson = function (path) {
            return JSON.parse(this.fs.readFileSync(path, 'utf8').toString());
        };
        FileSystem.__initializer = function(__parent){
            __super=__parent;
            FileSystem.fs = system.node.require('fs');
            FileSystem.path = system.node.require('path');
            FileSystem.crypto = system.node.require('crypto');
        };
        return FileSystem;
        function FileSystem() {
        }
    })();
    module.define('class', FileSystem);
    module.export("FileSystem", FileSystem);
    return {
        setters:[],
        execute: function() {
            FileSystem = module.init(FileSystem);
            module.export("default",FileSystem);
        }
    }
});
//# sourceMappingURL=fs.js.map