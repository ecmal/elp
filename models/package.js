system.register("elp/models/package", ["../utils/fs"], function(system,module) {
    var fs_1;
    var Package = (function (__super) {
        Package.read = function (path) {
            var pack;
            path = fs_1.default.resolve(path);
            if (!fs_1.default.exists(path)) {
                console.error("Invalid project path \"" + path + "\"");
            }
            if (fs_1.default.isDir(path)) {
                path = fs_1.default.resolve(path, 'package.json');
            }
            if (fs_1.default.isFile(path)) {
                pack = new Package(path);
            }
            return pack;
        };
        Object.defineProperty(Package.prototype, "name", {
            get: function () {
                return this.json.name;
            },
            set: function (v) {
                this.json.name = v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "registry", {
            get: function () {
                return this.json.registry;
            },
            set: function (v) {
                this.json.registry = v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "vendor", {
            get: function () {
                return this.json.vendor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "version", {
            get: function () {
                return this.json.version;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "directories", {
            get: function () {
                if (!this.json.directories) {
                    this.json.directories = {
                        source: './source',
                        output: './output'
                    };
                }
                return this.json.directories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "dirname", {
            get: function () {
                return fs_1.default.dirname(this.filename);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "filename", {
            get: function () {
                return this.path;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "sourceDir", {
            get: function () {
                return fs_1.default.resolve(this.dirname, this.directories.source);
            },
            set: function (v) {
                this.directories.source = fs_1.default.relative(this.dirname, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Package.prototype, "outputDir", {
            get: function () {
                return fs_1.default.resolve(this.dirname, this.directories.output);
            },
            set: function (v) {
                this.directories.output = fs_1.default.relative(this.dirname, v);
            },
            enumerable: true,
            configurable: true
        });
        Package.prototype.patch = function (props) {
            for (var key in props) {
                this.json[key] = props[key];
            }
            return this;
        };
        Package.prototype.clone = function () {
            return new Package(this.path, JSON.parse(JSON.stringify(this.json)));
        };
        Package.prototype.read = function (path) {
            this.json = fs_1.default.readJson(path);
        };
        Package.prototype.toJSON = function () {
            return this.json;
        };
        Package.prototype.write = function (path) {
            fs_1.default.writeJson(path, this.clone().patch({
                directories: {
                    source: '.',
                    output: '.'
                }
            }));
        };
        return Package;
        function Package(path, json) {
            this.path = path;
            if (!this.json) {
                this.read(path);
            }
        }
    })();
    module.define('class', Package);
    module.export("Package", Package);
    return {
        setters:[
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            Package = module.init(Package);
        }
    }
});
//# sourceMappingURL=package.js.map