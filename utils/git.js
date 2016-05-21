system.register("elp/utils/git", ["./fs"], function(system,module) {
    var fs_1;
    var Cp, URL, process, REFS, TAGS, BRANCHES, REPO;
    module.define("interface","Remote");
    module.define("interface","Remotes");
    var Entity = (function (__super) {
        Object.defineProperty(Entity.prototype, "repo", {
            get: function () {
                return this[REPO];
            },
            enumerable: true,
            configurable: true
        });
        return Entity;
        function Entity(repo) {
            this[REPO] = repo;
        }
    })();
    module.define('class', Entity);
    module.export("Entity", Entity);
    var Remote = (function (__super) {
        Object.defineProperty(Remote.prototype, "refs", {
            get: function () {
                return this[REFS];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Remote.prototype, "branches", {
            get: function () {
                var list = this[BRANCHES];
                if (!list) {
                    list = this[BRANCHES] = [];
                    for (var ref in this.refs) {
                        var arr = ref.match(/^refs\/heads\/(.*)$/);
                        if (arr) {
                            list.push(arr[1]);
                        }
                    }
                }
                return list;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Remote.prototype, "tags", {
            get: function () {
                var list = this[TAGS];
                if (!list) {
                    list = this[TAGS] = [];
                    for (var ref in this.refs) {
                        var arr = ref.match(/^refs\/tags\/(.*)$/);
                        if (arr) {
                            list.push(arr[1]);
                        }
                    }
                }
                return list;
            },
            enumerable: true,
            configurable: true
        });
        Remote.prototype.hasTag = function (name) {
            return this.tags.indexOf(name) >= 0;
        };
        Remote.prototype.hasBranch = function (name) {
            return this.branches.indexOf(name) >= 0;
        };
        Remote.prototype.inspect = function () {
            return {
                refs: this.refs,
                branches: this.branches,
                tags: this.tags
            };
        };
        Remote.prototype.parse = function (data) {
            var refs = this[REFS] = {};
            data.trim().split('\n').forEach(function (l) {
                var r = l.trim().split(/\s+/);
                refs[r[1]] = r[0];
            });
            return this;
        };
        Remote.__initializer = function(__parent){
            __super=__parent;
        };
        return Remote;
        function Remote() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Remote);
    module.export("Remote", Remote);
    var Status = (function (__super) {
        return Status;
        function Status(status) {
            var _this = this;
            var line, item, whitespace = /\s+/;
            var lines = status.trim().split('\n');
            var thead = lines.shift().trim();
            var initial = thead.match(/##\sInitial\scommit\son\s(.*)\s*/);
            if (initial) {
                this.initial = true;
                this.local = initial[1];
            }
            else {
                thead = thead.replace('...', ' ');
                thead = thead.replace(/(#|\s)+/, '');
                thead = thead.replace(/\[ahead\s(\d+)\]/, '$1');
                thead = thead.trim().split(/\s+/);
                if (thead[0]) {
                    var local = thead[0];
                    this.local = {
                        branch: local
                    };
                }
                if (thead[1]) {
                    var parts = thead[1].split('/');
                    var remote = parts[0];
                    var branch = parts[1];
                    this.remote = {
                        branch: branch,
                        name: remote
                    };
                }
                if (thead[2]) {
                    this.ahead = thead[2] ? parseInt(thead[2]) : 0;
                }
            }
            var changes = {};
            while (line = lines.shift()) {
                item = {};
                line = line.trim().split(whitespace);
                var actions = line.shift();
                item.path = line.shift();
                if (actions.indexOf('A') >= 0) {
                    item.added = true;
                }
                if (actions.indexOf('M') >= 0) {
                    item.modified = true;
                }
                if (actions.indexOf('D') >= 0) {
                    item.deleted = true;
                }
                if (actions.indexOf('R') >= 0) {
                    line.shift();
                    item.renamed = true;
                    item.from = item.path;
                    item.path = line.shift();
                }
                if (actions.indexOf('!') >= 0) {
                    item.ignored = true;
                }
                if (actions.indexOf('?') >= 0) {
                    item.untracked = true;
                }
                changes[item.path] = item;
            }
            var files = Object.keys(changes).sort(function (a, b) {
                if (a.indexOf('/') > 0 && b.indexOf('/') < 0) {
                    return -1;
                }
                else if (a.indexOf('/') < 0 && b.indexOf('/') > 0) {
                    return 1;
                }
                else {
                    return a == b ? 0 : (a < b ? -1 : 1);
                }
            });
            if (files.length) {
                this.clear = false;
                this.changes = {};
                files.forEach(function (f) {
                    _this.changes[f] = changes[f];
                });
            }
            else {
                this.clear = true;
            }
        }
    })();
    module.define('class', Status);
    module.export("Status", Status);
    var Repository = (function (__super) {
        Repository.refs = function (url) {
            return Repository.parseRefs(new Repository(process.cwd()).exec('ls-remote', url).output);
        };
        Repository.clear = function (dir) {
            var gidDir = fs_1.FileSystem.resolve(dir, '.git');
            fs_1.FileSystem.readDir(dir, false, true).forEach(function (f) {
                if (f != gidDir) {
                    if (fs_1.FileSystem.isDir(f)) {
                        fs_1.FileSystem.removeDir(f);
                    }
                    else {
                        fs_1.FileSystem.removeFile(f);
                    }
                }
            });
        };
        Repository.parseRefs = function (text) {
            var refs = {};
            text.trim().split('\n').forEach(function (r) {
                var _a = r.trim().split(/\s+/), sha = _a[0], ref = _a[1];
                var a = ref.split('/');
                var t = a.shift();
                var type = a.shift();
                var name = a.join('/');
                if (t == 'HEAD') {
                    refs.head = sha;
                }
                else {
                    if (!refs[type]) {
                        refs[type] = (_b = {}, _b[name] = sha, _b);
                    }
                    else {
                        refs[type][name] = sha;
                    }
                }
                var _b;
            });
            if (refs.remotes) {
                var remotes = {};
                Object.keys(refs.remotes).forEach(function (k) {
                    var sha = refs.remotes[k];
                    var _a = k.split('/'), remote = _a[0], name = _a[1];
                    delete refs.remotes[k];
                    if (name == 'HEAD') {
                        if (!remotes[remote]) {
                            remotes[remote] = { head: sha };
                        }
                        else {
                            remotes[remote].head = sha;
                        }
                    }
                    else {
                        var heads;
                        if (!remotes[remote]) {
                            remotes[remote] = heads = { heads: {} };
                        }
                        else {
                            remotes[remote].heads = heads = {};
                        }
                        heads[name] = sha;
                    }
                });
                refs.remotes = remotes;
            }
            if (refs.releases) {
                var releases = {};
                Object.keys(refs.releases).forEach(function (k) {
                    var sha = refs.releases[k];
                    var _a = k.split('/'), ver = _a[0], commit = _a[1];
                    delete refs.releases[k];
                    var commits = releases[ver];
                    if (!commits) {
                        commits = releases[ver] = {};
                    }
                    commits[commit] = sha;
                });
                refs.releases = releases;
            }
            return refs;
        };
        Repository.isGitDir = function (path) {
            return fs_1.FileSystem.exists(fs_1.FileSystem.resolve(path, '.git'));
        };
        Object.defineProperty(Repository.prototype, "base", {
            get: function () {
                return fs_1.FileSystem.resolve(this.path, '.git');
            },
            enumerable: true,
            configurable: true
        });
        ;
        Repository.prototype.exec = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var binary = false;
            var params = args.filter(function (a) {
                if (a == '--binary') {
                    return !(binary = true);
                }
                else {
                    return !!a;
                }
            });
            var result = Cp.spawnSync('git', params, {
                cwd: this.path
            });
            var output;
            if (result.output) {
                output = result.output.filter(function (i) { return (i && i.length > 0); }).map(function (i) { return i.toString(); }).join('');
            }
            if (!binary && output) {
                output = output.toString();
            }
            if (!!result.status) {
                throw new Error(("Failed To Execute \"git " + params.join(' ') + "\" for \"" + this.path + "\"\n\n") + output);
            }
            return {
                status: !result.status,
                command: 'git ' + params.join(' '),
                output: output
            };
        };
        Repository.prototype.hook = function (name, content) {
            var file, gitDir = this.path;
            if (fs_1.FileSystem.extname(gitDir) == '.git') {
                file = fs_1.FileSystem.resolve(this.path, 'hooks', name);
            }
            else {
                file = fs_1.FileSystem.resolve(this.base, 'hooks', name);
            }
            console.info('INSTALL HOOK', name, file);
            fs_1.FileSystem.writeFile(file, content);
            fs_1.FileSystem.chmodFile(file, '755');
        };
        Repository.prototype.head = function (ref) {
            var gitDir = this.base;
            if (fs_1.FileSystem.isFile(gitDir)) {
                gitDir = fs_1.FileSystem.readFile(gitDir).toString().replace('gitdir:', '').trim();
            }
            if (fs_1.FileSystem.isDir(gitDir)) {
                fs_1.FileSystem.writeFile(fs_1.FileSystem.resolve(gitDir, 'HEAD'), "ref: " + ref);
            }
            else {
                throw new Error("Not a git dir '" + gitDir + "'");
            }
        };
        Repository.prototype.config = function () {
            var fm = {}, mp = {};
            this.exec('config', '-l').output.trim().split('\n').forEach(function (p) {
                var _a = p.split('='), key = _a[0], val = _a[1];
                if (fm[key]) {
                    if (Array.isArray(fm[key])) {
                        fm[key].push(val);
                    }
                    else {
                        fm[key] = [fm[key], val];
                    }
                }
                else {
                    fm[key] = val;
                }
            });
            Object.keys(fm).forEach(function (k) {
                var path = k.split('.');
                var root = mp, key;
                while (key = path.shift()) {
                    if (path.length) {
                        root = root[key] = (root[key] || {});
                    }
                    else {
                        var val = fm[k];
                        if (typeof val == 'string') {
                            if (val.match(/^(true|false)$/)) {
                                val = (fm[k] == true);
                            }
                            else if (val.match(/^\d+$/)) {
                                val = parseInt(fm[k]);
                            }
                            else if (val.match(/^\d+\.\d+$/)) {
                                val = parseFloat(fm[k]);
                            }
                        }
                        root[key] = val;
                    }
                }
            });
            return mp;
        };
        Repository.prototype.getRemote = function (remote, pattern) {
            var result = this.exec('ls-remote', '--tags', '--heads', remote, pattern);
            if (result.output) {
                return new Remote(this).parse(result.output);
            }
            else {
                throw new Error("Invalid remote \"" + remote + "\" " + result.output);
            }
        };
        Repository.prototype.hasRemote = function (name) {
            return !!this.remotes()[name];
        };
        Repository.prototype.addRemote = function (name, url) {
            var options = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                options[_i - 2] = arguments[_i];
            }
            this.exec.apply(this, ['remote', 'add'].concat(options, [name, url]));
        };
        Object.defineProperty(Repository.prototype, "initialized", {
            get: function () {
                return fs_1.FileSystem.isDir(this.path) && (fs_1.FileSystem.isFile(fs_1.FileSystem.resolve(this.path, 'config')) ||
                    fs_1.FileSystem.isFile(fs_1.FileSystem.resolve(this.path, '.git', 'config')));
            },
            enumerable: true,
            configurable: true
        });
        Repository.prototype.clear = function () {
            Repository.clear(this.path);
        };
        Repository.prototype.init = function () {
            if (!fs_1.FileSystem.isDir(this.path)) {
                fs_1.FileSystem.createDir(this.path, true);
            }
            if (!fs_1.FileSystem.isDir(this.base)) {
                if (fs_1.FileSystem.extname(this.path) == '.git') {
                    this.exec('init', '--bare');
                }
                else {
                    this.exec('init');
                }
                return true;
            }
            else {
                return false;
            }
        };
        Repository.prototype.fetch = function (remote, branch) {
            if (branch) {
                return this.exec('fetch', remote, branch).output;
            }
            else {
                return this.exec('fetch', remote).output;
            }
        };
        Repository.prototype.remote = function (name) {
            return this.exec('remote', 'show', name).output;
        };
        Repository.prototype.remotes = function () {
            var remotes = {};
            this.exec('remote', '-v').output.trim().split('\n').forEach(function (r) {
                var row = r.trim();
                if (row) {
                    var _a = row.split(/\s+/), name = _a[0], url = _a[1], type = _a[2];
                    var remote = remotes[name];
                    if (!remote) {
                        remote = remotes[name] = { name: name };
                    }
                    remote[type.replace(/^\((.*)\)$/, '$1')] = url;
                }
            });
            for (var r in remotes) {
                var remote = remotes[r];
                var refs = Repository.parseRefs(this.exec('ls-remote', r).output);
                for (var i in refs) {
                    remote[i] = refs[i];
                }
                var url = URL.parse(remote.fetch || remote.push);
                delete url.auth;
                remote.url = URL.format(url);
            }
            return remotes;
        };
        Repository.prototype.status = function () {
            var status = new Status(this.exec('status', '--porcelain', '--branch', '--untracked-files=all').output);
            if (status.local && status.local.branch) {
                status.local.commit = this.rev(status.local.branch);
            }
            if (status.remote && status.remote.branch) {
                status.remote.commit = this.rev(status.remote.name + '/' + status.remote.branch);
            }
            return status;
        };
        Repository.prototype.rev = function (name) {
            return String(this.exec('rev-parse', name).output).trim();
        };
        Repository.prototype.refs = function (remote) {
            if (remote) {
                return Repository.parseRefs(this.exec('ls-remote', remote).output);
            }
            else {
                return Repository.parseRefs(this.exec('show-ref', '--head').output);
            }
        };
        Repository.prototype.readDir = function (branch, base) {
            var _this = this;
            if (branch === void 0) { branch = 'HEAD'; }
            var tree = branch, ref = 'head';
            if (!tree.match(/^[a-f0-9]{40}$/)) {
                var refs = this.refs();
                if (tree == 'HEAD') {
                    tree = refs.head;
                    for (var name in refs.heads) {
                        if (refs.head == refs.heads[name]) {
                            ref = 'branch';
                            branch = name;
                            break;
                        }
                    }
                }
                else if (refs.heads[tree]) {
                    ref = 'branch';
                    tree = refs.heads[tree];
                }
                else if (refs.tags[tree]) {
                    ref = 'tag';
                    tree = refs.tags[tree];
                }
            }
            var files = {};
            this.exec('ls-tree', '-rl', branch + (base ? ':' + base : '')).output.trim().split('\n').forEach(function (l) {
                var _a = l.split(/\s+/), mode = _a[0], type = _a[1], sha = _a[2], size = _a[3], path = _a[4];
                files[path] = {
                    path: path,
                    type: type,
                    sha: sha,
                    tree: tree,
                    ref: ref,
                    branch: branch,
                    base: 'git:' + branch + ':/' + base,
                    git: _this.path,
                    mode: parseInt(mode),
                    size: parseInt(size)
                };
            });
            return files;
        };
        Repository.prototype.readFile = function (branch, path) {
            return this.exec('show', '--binary', path ? branch + ':' + path : branch).output;
        };
        Repository.prototype.log = function (obj, count) {
            var header = ['sha', 'tree', 'parent', 'commit.date'];
            var format = '%H,%T,%P,%aI,%s,%b,%D,%N,%an,%ae'.split(',').join('\u001F');
            var options = [];
            if (obj) {
                options.push(obj);
            }
            if (typeof count == 'number') {
                options.push(count);
            }
            return this.exec.apply(this, ['log', "--pretty=format:" + format].concat(options)).output.split('\n').map(function (l) {
                var r = l.split('\u001F');
                r = {
                    commit: r[0],
                    tree: r[1],
                    parent: r[2],
                    date: new Date(r[3]),
                    subject: r[4],
                    body: r[5],
                    refs: r[6],
                    notes: r[7],
                    author: {
                        name: r[8],
                        email: r[9],
                    }
                };
                for (var i in r) {
                    if (r[i] === '') {
                        delete r[i];
                    }
                }
                return r;
            });
        };
        Repository.prototype.tag = function (name, ref) {
            var result;
            if (ref) {
                result = this.exec('tag', name, ref);
            }
            else {
                result = this.exec('tag', name);
            }
            return result.output;
        };
        Repository.prototype.push = function (remote, ref, tags) {
            var result;
            if (tags) {
                result = this.exec('push', remote, '--tags', ref);
            }
            else {
                result = this.exec('push', remote, ref);
            }
            return result.output;
        };
        Repository.prototype.toString = function () {
            return "Git(" + this.base + ")";
        };
        Repository.prototype.inspect = function () {
            return this.toString();
        };
        return Repository;
        function Repository(path) {
            this.path = path;
        }
    })();
    module.define('class', Repository);
    module.export("Repository", Repository);
    return {
        setters:[
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            Cp = system.node.require('child_process');
            URL = system.node.require('url');
            process = system.node.process;
            REFS = Symbol('refs');
            TAGS = Symbol('tags');
            BRANCHES = Symbol('branches');
            REPO = Symbol('repo');
            Entity = module.init(Entity);
            Remote = module.init(Remote,Entity);
            Status = module.init(Status);
            Repository = module.init(Repository);
        }
    }
});
//# sourceMappingURL=git.js.map