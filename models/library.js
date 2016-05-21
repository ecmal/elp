system.register("elp/models/library", ["./url", "./registry", "../utils/git", "../utils/fs", "../config"], function(system,module) {
    var url_1, registry_1, git_1, fs_1, config_1;
    var URL, GIT, REGISTRY;
    var Library = (function (__super) {
        Object.defineProperty(Library, "home", {
            get: function () {
                return fs_1.default.resolve(config_1.default.home, 'registry');
            },
            enumerable: true,
            configurable: true
        });
        Library.local = function (url) {
            return fs_1.default.resolve(this.home, url.vendor, url.project + '.git');
        };
        Library.clear = function () {
            fs_1.default.removeDir(this.home);
        };
        Library.list = function () {
            var _this = this;
            var libs = [];
            if (fs_1.default.isDir(this.home)) {
                fs_1.default.readDir(this.home, false, true).forEach(function (v) {
                    var vendor = fs_1.default.relative(_this.home, v);
                    fs_1.default.readDir(v, false, true).forEach(function (p) {
                        var project = fs_1.default.basename(p, '.git');
                        libs.push(new url_1.Url(vendor + "/" + project));
                    });
                });
            }
            return libs;
        };
        Library.get = function (url) {
            return new Library(url);
        };
        Library.show = function (url) {
            var u = url_1.Url.parse(url);
            var registry = registry_1.Registry.get(u);
            var remote = registry.remote(u);
            var refs = git_1.Repository.refs(remote);
            var release = 'release';
            var source = (function () {
                for (var _i = 0, _a = Object.keys(refs.heads); _i < _a.length; _i++) {
                    var branch = _a[_i];
                    if (refs.heads[branch] == refs.head) {
                        return branch;
                    }
                }
                return refs.heads[0];
            })();
            if (refs.tags) {
                var versions = Object.keys(refs.tags).map(function (v) {
                    return {
                        version: v,
                        sha: refs.tags[v]
                    };
                });
            }
            var local = Library.local(u);
            return {
                name: u.project,
                vendor: u.vendor,
                remote: remote,
                local: local,
                exist: fs_1.default.isDir(local),
                registry: registry.id,
                source: {
                    name: source,
                    sha: refs.heads[source]
                },
                release: {
                    name: release,
                    sha: refs.heads[release]
                },
                versions: versions,
                refs: refs
            };
        };
        Library.install = function (url) {
            Library.get(url_1.Url.parse(url)).install();
        };
        Object.defineProperty(Library.prototype, "url", {
            get: function () {
                return this[URL];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "registry", {
            get: function () {
                var v = this[REGISTRY];
                if (!v) {
                    v = this[REGISTRY] = registry_1.Registry.get(this.url);
                }
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "local", {
            get: function () {
                return Library.local(this.url);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "remote", {
            get: function () {
                return this.registry.remote(this.url);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "installed", {
            get: function () {
                return fs_1.default.isDir(Library.local(this.url));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "versions", {
            get: function () {
                var refs = this.git.refs();
                var versions = {};
                Object.keys(refs.tags).forEach(function (t) {
                    versions[t] = refs.tags[t];
                });
                Object.keys(refs.releases).forEach(function (v) {
                    var release = refs.releases[v];
                    Object.keys(release).forEach(function (c) {
                        if (versions[v] != release[c]) {
                            versions[v + '-' + c] = release[c];
                        }
                    });
                });
                return versions;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Library.prototype, "git", {
            get: function () {
                var v = this[GIT];
                if (!v) {
                    v = this[GIT] = new git_1.Repository(this.local);
                }
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Library.prototype.toString = function () {
            return "Library(" + this.url.url + ")";
        };
        Library.prototype.inspect = function () {
            return this.toString();
        };
        Library.prototype.info = function () {
        };
        Library.prototype.install = function (dev) {
            if (!this.git.initialized) {
                this.git.init();
            }
            var remotes = this.git.remotes();
            if (!remotes[this.registry.id]) {
                this.git.exec('config', '--local', "remote." + this.registry.id + ".url", this.registry.remote(this.url));
                this.git.exec('config', '--local', '--add', "remote." + this.registry.id + ".fetch", "+refs/tags/*:refs/tags/*");
                this.git.exec('config', '--local', '--add', "remote." + this.registry.id + ".fetch", "+refs/releases/*:refs/releases/*");
                if (dev) {
                    this.git.exec('config', '--local', '--add', "remote." + this.registry.id + ".fetch", "+refs/heads/*:refs/remotes/" + this.registry.id + "/*");
                }
            }
            /*this.git.setConfig({
                [`remote.${this.registry.id}.url`]:this.registry.remote(this.url),
                [`remote.${this.registry.id}.fetch`]:[
                    `+refs/tags/*:refs/tags/*`,
                    `+refs/release/*:refs/release/*`
                ]
            });*/
            console.info(JSON.stringify(this.git.config(), null, 2));
            console.info(this.git.fetch(this.registry.id));
        };
        Library.prototype.fetch = function () {
            this.git.exec('fetch', this.registry.id);
        };
        Library.prototype.extract = function (dir) {
            var _this = this;
            var versions = this.versions;
            if (versions[this.url.version]) {
                var map = this.git.readDir(versions[this.url.version]);
                var files = Object.keys(map).map(function (f) {
                    var file = fs_1.default.resolve(dir, _this.url.project, map[f].path);
                    var content = _this.git.readFile(map[f].sha);
                    fs_1.default.writeFile(file, content);
                });
            }
        };
        Library.prototype.workdir = function (path, branch, remote) {
            var result;
            this.git.exec('worktree', 'prune');
            if (branch) {
                result = this.git.exec('worktree', 'add', '-B', branch, path, remote).output;
            }
            else {
                result = this.git.exec('worktree', 'add', path).output;
            }
            console.info(result);
        };
        Library.prototype.remove = function () {
            fs_1.default.removeDir(this.git.path);
        };
        Library.prototype.files = function (version) {
            return this.git.readDir(version);
        };
        Library.prototype.cached = function () {
            console.info(this.url.registry, this.url.vendor, this.url.project);
        };
        return Library;
        function Library(url) {
            this[URL] = url_1.Url.parse(url);
        }
    })();
    module.define('class', Library);
    module.export("Library", Library);
    return {
        setters:[
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (registry_1_1) {
                registry_1 = registry_1_1;
            },
            function (git_1_1) {
                git_1 = git_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
            }],
        execute: function() {
            URL = Symbol('url');
            GIT = Symbol('git');
            REGISTRY = Symbol('registry');
            Library = module.init(Library);
        }
    }
});
//# sourceMappingURL=library.js.map