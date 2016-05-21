system.register("elp/models/project", ["../utils/fs", "../utils/git", "../compiler/compiler", "./source", "./registry", "./url", "./library"], function(system,module) {
    var fs_1, git_1, git_2, git_3, compiler_1, source_1, registry_1, url_1, library_1;
    var FILE, CONFIG, COMPILER, SOURCES, DEPS, REPO_SOURCE, REPO_RELEASE;
    var Project = (function (__super) {
        Project.read = function (path) {
            var pack;
            path = fs_1.default.resolve(path);
            if (!fs_1.default.exists(path)) {
                console.error("Invalid project path \"" + path + "\"");
            }
            if (fs_1.default.isDir(path)) {
                path = fs_1.default.resolve(path, 'package.json');
            }
            pack = new Project(path);
            if (fs_1.default.isFile(path)) {
                pack.patch(fs_1.default.readJson(path));
            }
            return pack;
        };
        Object.defineProperty(Project.prototype, "filename", {
            get: function () {
                return this[FILE];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "dirname", {
            get: function () {
                return fs_1.default.dirname(this.filename);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "config", {
            get: function () {
                var c = this[CONFIG];
                if (!c) {
                    c = this[CONFIG] = {};
                }
                return c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "sources", {
            get: function () {
                var c = this[SOURCES];
                if (!c) {
                    c = this[SOURCES] = {};
                }
                return c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "sourcesAll", {
            get: function () {
                var sources = this.sourcesSelf;
                for (var d in this.deps) {
                    var library = this.deps[d];
                    for (var s in library.sources) {
                        sources.push(library.sources[s]);
                    }
                }
                return sources;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "sourcesSelf", {
            get: function () {
                var sources = [];
                for (var s in this.sources) {
                    sources.push(this.sources[s]);
                }
                return sources;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "git", {
            get: function () {
                var c = this[REPO_SOURCE];
                if (!c && git_1.Repository.isGitDir(this.dirname)) {
                    c = this[REPO_SOURCE] = new git_1.Repository(this.dirname);
                }
                return c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "release", {
            get: function () {
                var c = this[REPO_RELEASE];
                if (!c && this.git) {
                    c = this[REPO_RELEASE] = new git_1.Repository(this.outputDir);
                    var refs = this.git.refs();
                    if (!git_1.Repository.isGitDir(this.outputDir)) {
                        this.git.exec('worktree', 'prune');
                        if (refs.heads.release) {
                            this.git.exec('worktree', 'add', this.outputDir, 'release');
                        }
                        else {
                            var tempName = 'temp-' + Math.round(Math.random() * 1000);
                            this.git.exec('worktree', 'add', '-b', tempName, this.outputDir);
                            console.info(c.exec('checkout', '--orphan', 'release').output);
                            this.git.exec('branch', '-d', tempName);
                        }
                        var refs = c.refs();
                        console.info(refs);
                    }
                }
                else {
                    console.info("NOT RELEASE", this.dirname, git_1.Repository.isGitDir(this.dirname));
                }
                return c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "compiler", {
            get: function () {
                var c = this[COMPILER];
                if (!c) {
                    c = this[COMPILER] = new compiler_1.Compiler(this);
                }
                return c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "remotes", {
            get: function () {
                return this.git.remotes();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "status", {
            get: function () {
                return this.git.status();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "deps", {
            get: function () {
                return this[DEPS];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "format", {
            get: function () {
                return this.config.format;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "target", {
            get: function () {
                return this.config.target;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "bundle", {
            get: function () {
                if (this.config.bundle) {
                    return "package.js";
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "core", {
            get: function () {
                return this.config.core || 'core';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "name", {
            get: function () {
                return this.config.name;
            },
            set: function (v) {
                this.config.name = v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "vendor", {
            get: function () {
                return this.config.vendor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "version", {
            get: function () {
                return this.config.version;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "registry", {
            get: function () {
                return this.config.registry;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "dirs", {
            get: function () {
                if (!this.config.directories) {
                    this.config.directories = {};
                }
                return this.config.directories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "main", {
            get: function () {
                return this.config.main ? this.config.main : this.name + "/package";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "sourceDir", {
            get: function () {
                var srcDir = this.dirs.source;
                if (!srcDir) {
                    if (fs_1.default.isDir(fs_1.default.resolve(this.dirname, './src'))) {
                        srcDir = './src';
                    }
                    else if (fs_1.default.isDir(fs_1.default.resolve(this.dirname, './source'))) {
                        srcDir = './source';
                    }
                    else if (fs_1.default.isDir(fs_1.default.resolve(this.dirname, './sources'))) {
                        srcDir = './sources';
                    }
                    this.dirs.source = srcDir;
                }
                if (srcDir) {
                    return fs_1.default.resolve(this.dirname, srcDir);
                }
                else {
                    throw new Error('source directory not specified');
                }
            },
            set: function (v) {
                this.dirs.source = fs_1.default.relative(this.dirname, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "testsDir", {
            get: function () {
                var testDir = this.dirs.tests;
                if (!testDir) {
                    if (fs_1.default.isDir(fs_1.default.resolve(this.dirname, './test'))) {
                        testDir = './test';
                    }
                    else if (fs_1.default.isDir(fs_1.default.resolve(this.dirname, './tests'))) {
                        testDir = './tests';
                    }
                    this.dirs.tests = testDir;
                }
                if (testDir) {
                    return fs_1.default.resolve(this.dirname, testDir);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "vendorDir", {
            get: function () {
                var venDir = this.dirs.vendor;
                if (!venDir) {
                    venDir = this.dirs.vendor = './out';
                }
                return fs_1.default.resolve(this.dirname, venDir);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Project.prototype, "outputDir", {
            get: function () {
                return fs_1.default.resolve(this.vendorDir, this.name);
            },
            enumerable: true,
            configurable: true
        });
        Project.prototype.patch = function (props) {
            for (var key in props) {
                this.config[key] = props[key];
            }
            return this;
        };
        Project.prototype.watch = function (tests) {
            if (tests === void 0) { tests = false; }
            tests = tests && !!this.testsDir;
            this.clean();
            this.readFs(tests);
            this.watchSources(tests);
            this.writeSources();
            this.writePackage();
        };
        Project.prototype.compile = function (tests, bundle, exec) {
            if (tests === void 0) { tests = false; }
            if (bundle === void 0) { bundle = null; }
            if (exec === void 0) { exec = false; }
            if (bundle) {
                console.info("Bundling" + (exec ? ' executable' : '') + " " + bundle);
            }
            tests = tests && !!this.testsDir;
            if (bundle) {
                this.readFs();
                this.compileSources();
                this.bundleSources(exec, bundle);
            }
            else {
                this.clean();
                this.readFs(tests);
                this.compileSources();
                this.writeSources();
                this.writePackage();
            }
        };
        Project.prototype.install = function () {
            var _this = this;
            Object.keys(this.config.libraries).forEach(function (k) {
                var key = url_1.Url.parse(k);
                var url = url_1.Url.parse(_this.config.libraries[k]);
                if (!url.project) {
                    url.project = key.project;
                }
                if (!url.vendor) {
                    url.vendor = key.vendor || _this.vendor;
                }
                if (!url.registry) {
                    url.registry = key.registry || _this.registry;
                }
                var library = library_1.Library.get(url);
                if (!library.installed) {
                    library.install();
                }
                else {
                    library.fetch();
                }
                library.extract(_this.vendorDir);
            });
        };
        Project.prototype.publish = function (force) {
            this.clean();
            var stats = this.git.status();
            var refs = this.git.refs();
            var num = stats.local.commit.substring(0, 6);
            var com = this.git.log(stats.local.commit, -1)[0];
            var rem = stats.remote.name;
            var ver = this.version;
            var rel = "refs/releases/" + ver + "/" + num;
            //var name = 'T'+parseInt(Math.random()*1000);
            //this.git.exec('worktree','prune');
            //this.git.exec('worktree','add',this.outputDir,'-b',name);
            var rels = refs.releases;
            var tags = refs.tags;
            if (force) {
                console.info(this.git.exec('update-ref', '-d', rel));
                console.info(this.git.push(rem, ":" + rel));
            }
            else if (rels && rels[ver] && rels[ver][num]) {
                throw new Error("Already published '" + ver + "/" + num + "'");
            }
            if (tags && tags[ver]) {
                console.info(this.git.exec('tag', '-d', ver));
                console.info(this.git.push(rem, ":refs/tags/" + ver));
            }
            var release = new git_1.Repository(this.outputDir);
            release.init();
            release.addRemote('origin', this.git.path);
            release.head(rel);
            //this.git.exec('branch','-d',name);
            this.readGit();
            this.compileSources();
            this.writeSources();
            this.writePackage();
            var status = release.status();
            var changes = status.changes;
            var added = [], deleted = [];
            if (!status.clear) {
                console.info(status);
                for (var c in changes) {
                    var change = changes[c];
                    if (change.untracked) {
                        added.push(change.path);
                    }
                    if (change.deleted) {
                        deleted.push(change.path);
                    }
                }
                if (added.length) {
                    release.exec.apply(release, ['add'].concat(added));
                }
                if (deleted.length) {
                    release.exec.apply(release, ['rm'].concat(deleted));
                }
                console.info(release.exec('commit', '-am', com.subject));
                status = release.status();
                if (status.clear) {
                    console.info(status);
                    console.info(release.push('origin', rel));
                    console.info(this.git.tag(ver, rel));
                    console.info(this.git.push(rem, rel, true));
                }
            }
            else {
                console.info('No Changes');
            }
        };
        Project.prototype.clean = function () {
            fs_1.default.removeDir(this.outputDir);
        };
        Project.prototype.toString = function (full) {
            if (full === void 0) { full = false; }
            return "Project(" + this.name + (full ? ',' + JSON.stringify(this.config, null, 2) : '') + ")";
        };
        Project.prototype.inspect = function () {
            return this.toString(true);
        };
        Project.prototype.readFs = function (tests) {
            if (tests === void 0) { tests = false; }
            this.readDependencies();
            this.readSourcesFromFs(tests);
            return Object.keys(this.sources);
        };
        Project.prototype.readGit = function (branch) {
            this.readDependencies();
            this.readSourcesFromGit(branch);
            return Object.keys(this.sources);
        };
        Project.prototype.readSourcesFromGit = function (branch, main) {
            if (branch === void 0) { branch = 'HEAD'; }
            if (main === void 0) { main = true; }
            if (this.git) {
                var files = this.git.readDir(branch, this.dirs.source);
                for (var f in files) {
                    var file = files[f];
                    file.from = 'git';
                    file.name = source_1.Source.getName(file.path);
                    file.ext = source_1.Source.getExt(file.path);
                    if (file.ext) {
                        file.content = this.git.readFile(file.sha);
                        var source = this.sources[file.name];
                        if (!source) {
                            source = this.sources[file.name] = new source_1.Source(this.name, file.name, main);
                        }
                        source.addFile(file);
                    }
                }
            }
        };
        Project.prototype.readSourcesFromFs = function (tests, main) {
            var _this = this;
            if (tests === void 0) { tests = false; }
            if (main === void 0) { main = false; }
            fs_1.default.readDir(this.sourceDir, true).forEach(function (f) {
                var file = {
                    path: fs_1.default.relative(_this.sourceDir, f)
                };
                if (file.path != 'package.json') {
                    file.from = 'file';
                    file.name = source_1.Source.getName(file.path);
                    file.ext = source_1.Source.getExt(file.path);
                    if (file.ext) {
                        file.content = fs_1.default.readFile(f);
                        var source = _this.sources[file.name];
                        if (!source) {
                            source = _this.sources[file.name] = new source_1.Source(_this.name, file.name, main);
                        }
                        source.addFile(file);
                    }
                }
            });
            if (tests) {
                fs_1.default.readDir(this.testsDir, true).forEach(function (f) {
                    var file = {
                        path: fs_1.default.relative(_this.testsDir, f)
                    };
                    if (file.path != 'package.json') {
                        file.from = 'file';
                        file.name = source_1.Source.getName(file.path);
                        file.ext = source_1.Source.getExt(file.path);
                        if (file.ext) {
                            file.content = fs_1.default.readFile(f);
                            var source = _this.sources[file.name];
                            if (!source) {
                                source = _this.sources[file.name] = new source_1.Source(_this.name, file.name, main);
                                source.dirname = fs_1.default.dirname(f);
                            }
                            source.addFile(file);
                        }
                    }
                });
            }
        };
        Project.prototype.readDependencies = function () {
            var _this = this;
            var deps = {};
            if (fs_1.default.isDir(this.vendorDir)) {
                fs_1.default.readDir(this.vendorDir, false, true).forEach(function (dir) {
                    if (fs_1.default.isDir(dir) && fs_1.default.isFile(fs_1.default.resolve(dir, 'package.json'))) {
                        var project = Project.read(dir);
                        if (project.name != _this.name) {
                            project.patch({
                                directories: {
                                    source: '.',
                                    vendor: '..'
                                }
                            });
                            project.readSourcesFromFs(false, false);
                            deps[project.name] = project;
                        }
                    }
                });
            }
            this[DEPS] = deps;
        };
        Project.prototype.compileSources = function () {
            var diagnostics = this.compiler.compile();
            if (diagnostics.length) {
                console.info('FAILED');
            }
            else {
                console.info('COMPILED');
            }
        };
        Project.prototype.writeSources = function () {
            var _this = this;
            this.sourcesSelf.forEach(function (s) {
                _this.writeSource(s);
            });
        };
        Project.prototype.watchSources = function (tests) {
            var _this = this;
            if (tests === void 0) { tests = false; }
            var diagnostics = this.compiler.compile();
            if (diagnostics.length) {
                console.info('FAILED');
            }
            else {
                console.info('COMPILED');
            }
            var listener = function (t, e, f) {
                try {
                    var from = t ? 'test' : 'main';
                    var path = fs_1.default.resolve(t ? _this.testsDir : _this.sourceDir, f);
                    var file = { path: f };
                    if (fs_1.default.exists(path)) {
                        file.from = 'file';
                        file.name = source_1.Source.getName(file.path);
                        file.ext = source_1.Source.getExt(file.path);
                        if (file.ext) {
                            file.content = fs_1.default.readFile(path).toString();
                            var source = _this.sources[file.name];
                            if (!source) {
                                source = _this.sources[file.name] = new source_1.Source(_this.name, file.name, true);
                                source.dirname = fs_1.default.dirname(path);
                            }
                            source.addFile(file);
                            var diagnostics = _this.compiler.compile();
                            if (diagnostics.length) {
                                console.info("FAILED   " + from + " : " + file.path);
                            }
                            else {
                                console.info("COMPILED " + from + " : " + file.path);
                            }
                            if (_this.bundle) {
                                _this.writeSource(_this.sources['package']);
                            }
                            else {
                                _this.writeSource(source);
                            }
                        }
                    }
                    else {
                        console.info("DELETED  :" + from + " : " + file.path);
                    }
                }
                catch (ex) {
                    console.info(ex.stack);
                }
            };
            console.info('WATCHING');
            console.info(' * ' + this.sourceDir);
            fs_1.default.watchDir(this.sourceDir, function (e, f) { return listener(false, e, f); }, true);
            if (tests) {
                console.info(' * ' + this.testsDir);
                fs_1.default.watchDir(this.testsDir, function (e, f) { return listener(true, e, f); }, true);
            }
        };
        Project.prototype.bundleSources = function (exec, filename) {
            var runtime = [], sources = [];
            this.sourcesAll.forEach(function (s) {
                if (s.script) {
                    if (s.project == 'runtime') {
                        runtime.push(s.cleanMap());
                    }
                    else {
                        sources.push(s.cleanMap());
                    }
                }
            });
            runtime = runtime.concat(sources);
            runtime.push("system.import(\"" + this.main + "\");");
            if (exec) {
                runtime.unshift('#!/usr/bin/env node');
            }
            var file = fs_1.default.resolve(this.dirname, filename || 'bundle.js');
            fs_1.default.writeFile(file, runtime.join('\n'));
        };
        Project.prototype.writePackage = function () {
            var json = this.compilePackage();
            var packFile = fs_1.default.resolve(this.vendorDir, this.name, 'package.json');
            var packContent = JSON.stringify(json, null, '  ');
            fs_1.default.writeFile(packFile, packContent);
        };
        Project.prototype.compilePackage = function () {
            var json = {
                name: this.name,
                vendor: this.vendor,
                version: this.version,
                registry: this.registry,
                format: this.format,
                bundle: !!this.bundle,
                libraries: this.config.libraries
            };
            if (this.git) {
                var status = this.git.status();
                var config = this.git.config();
                json.author = config.user;
                if (status.remote) {
                    json.commit = status.remote.commit;
                    var repoUrl = config.remote[status.remote.name].url;
                    json.repository = repoUrl;
                    json.registry = registry_1.Registry.for(repoUrl).id;
                }
            }
            json.modules = {};
            this.sourcesSelf.forEach(function (s) {
                json.modules[s.name] = s.toMetadata();
            });
            return json;
        };
        Project.prototype.writeSource = function (s) {
            for (var _i = 0, _a = ['tsd', 'js', 'map']; _i < _a.length; _i++) {
                var t = _a[_i];
                var file_1 = s[t];
                if (file_1) {
                    var path = fs_1.default.resolve(this.vendorDir, this.name, s.name + file_1.ext);
                    fs_1.default.writeFile(path, file_1.content);
                }
            }
            for (var _b = 0, _c = s.resources; _b < _c.length; _b++) {
                var file = _c[_b];
                var path = fs_1.default.resolve(this.vendorDir, this.name, s.name + file.ext);
                fs_1.default.writeFile(path, file.content);
            }
        };
        return Project;
        function Project(path) {
            this[FILE] = path;
        }
    })();
    module.define('class', Project);
    module.export("Project", Project);
    return {
        setters:[
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (git_1_1) {
                git_1 = git_1_1;
                git_2 = git_1_1;
                git_3 = git_1_1;
            },
            function (compiler_1_1) {
                compiler_1 = compiler_1_1;
            },
            function (source_1_1) {
                source_1 = source_1_1;
            },
            function (registry_1_1) {
                registry_1 = registry_1_1;
            },
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (library_1_1) {
                library_1 = library_1_1;
            }],
        execute: function() {
            FILE = Symbol('file');
            CONFIG = Symbol('config');
            COMPILER = Symbol('compiler');
            //const WATCHER:symbol = Symbol('watcher');
            SOURCES = Symbol('sources');
            DEPS = Symbol('dependencies');
            REPO_SOURCE = Symbol('repo.source');
            REPO_RELEASE = Symbol('repo.release');
            Project = module.init(Project);
        }
    }
});
//# sourceMappingURL=project.js.map