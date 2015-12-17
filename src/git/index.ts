import * as ChildProcess from 'child_process';
import * as Path from 'path';



export class Git {
    private _baseDir:string;
    private _command:string = 'git';

    private _parsePull(pull) {
        var changes = {
            files: [],
            insertions: {},
            deletions: {},
            summary: {
                changes: 0,
                insertions: 0,
                deletions: 0
            }
        };

        var fileUpdateRegex = /^\s*(.+)\s\|\s(\d+)\s([\+]+)/;
        for (var lines = pull.split('\n'), i = 0, l = lines.length; i < l; i++) {
            var update = fileUpdateRegex.exec(lines[i]);

            // search for update statement for each file
            if (update) {
                changes.files.push(update[1]);

                var insertions = update[3].length;
                var updates =parseInt(update[2]);
                if (insertions) {
                    changes.insertions[update[1]] = insertions;
                }
                if (updates > insertions) {
                    changes.deletions[update[1]] = updates - insertions;
                }
            }

            // summary appears after updates
            else if (changes.files.length && (update = /(\d+)\D+(\d+)\D+(\d+)/.exec(lines[i]))) {
                changes.summary.changes = +update[1];
                changes.summary.insertions = +update[2];
                changes.summary.deletions = +update[3];
            }
        }

        return changes;
    };

    private _parseStatus(status) {
        var line;
        var lines = status.trim().split('\n');

        var unversioned = [];
        var deleted = [];
        var modified = [];
        var created = [];

        var whitespace = /\s+/;

        while (line = lines.shift()) {
            line = line.trim().split(whitespace);

            switch (line.shift()) {
                case "??":
                    unversioned.push(line.join());
                    break;
                case "D":
                    deleted.push(line.join());
                    break;
                case "M":
                    modified.push(line.join());
                    break;
                case "A":
                case "AM":
                    created.push(line.join());
                    break;
            }
        }

        return {
            unversioned: unversioned,
            deleted: deleted,
            modified: modified,
            created: created
        };
    };

    private _parseCheckout(checkout) {};

    private _parseFetch(fetch) {
        return fetch;
    };

    private _parseListLog(logs) {
        var logList = logs.split('\n').map(function (item) {
            var parts = item.split(';');

            return {
                hash: parts[0],
                date: parts[1],
                message: parts[2],
                author_name: parts[3],
                author_email: parts[4]
            }
        });

        return {
            latest: logList.length && logList[logList.length - 1],
            total: logList.length,
            all: logList
        };
    };

    /**
     * Schedules the supplied command to be run, the command should not include the name of the git binary and should
     * be an array of strings passed as the arguments to the git binary.
     *
     * @param {string[]} command
     * @param {Function} [then]
     *
     * @returns {Git}
     */
    private _run(command):Promise<any> {
        if (typeof command === "string") {
            command = command.split(" ");
        }
        return new Promise<any>((accept,reject)=>{
            var log:any = [];
            var spawned = ChildProcess.spawn(this._command, command.slice(0), {
                cwd: this._baseDir
            });
            spawned.stdout.on('data', function (buffer) {
                log.push(buffer);
            });
            spawned.stderr.on('data', function (buffer) {
                log.push(buffer);
            });
            spawned.on('close', (exitCode, exitSignal)=> {
                log = Buffer.concat(log).toString('utf-8');
                if (exitCode) {
                    reject(log);
                } else {
                    accept(log);
                }
            });
        });
    };

    constructor(baseDir?:string) {
        this.chdir(baseDir||'.');
    }

    chdir(dir){
        this._baseDir = Path.resolve(this._baseDir || process.cwd(), dir);
    }
    /**
     * Sets the path to a custom git binary, should either be `git` when there is an installation of git available on
     * the system path, or a fully qualified path to the executable.
     *
     * @param {string} command
     * @returns {Git}
     */
    customBinary(command):Git {
        this._command = command;
        return this;
    }

    /**
     * Initialize a git repo
     *
     * @param {Boolean} [bare=false]
     * @param {Function} [then]
     */
    init(bare=false) {
        var commands = ['init'];
        if (bare === true) {
            commands.push('--bare');
        }
        return this._run(commands);
    }

    /**
     * Check the status of the local repo
     *
     * @param {Function} [then]
     */
    status() {
        return this._run(['status', '--porcelain']).then(data=>this._parseStatus(data));
    }

    /**
     * Clone a git repo
     *
     * @param {string} repoPath
     * @param {string} localPath
     * @param {Function} [then]
     */
    clone(repoPath, localPath) {
        return this._run(['clone', repoPath, localPath]);
    }

    /**
     * Internally uses pull and tags to get the list of tags then checks out the latest tag.
     *
     * @param {Function} [then]
     */
    /*checkoutLatestTag(then) {
        var git = this;
        return this.pull().then(()=>this.tags().then(function (err, tags) {
            git.checkout(tags.latest, then);
        });
    }*/

    /**
     * Adds one or more files to source control
     *
     * @param {string|string[]} files
     * @param {Function} [then]
     */
    add(files) {
        return this._run(['add'].concat(files));
    }

    /**
     * Commits changes in the current working directory - when specific file paths are supplied, only changes on those
     * files will be committed.
     *
     * @param {string} message
     * @param {string|string[]} [files]
     * @param {Function} [then]
     */
    commit(files,message='Committing Changes') {
        return this._run(['commit', '-m', message].concat([].concat(files || []))).then((data)=>{
            var lines = data.trim().split('\n');
            var commitData, commitSummary = {
                branch  : '',
                commit  : '',
                summary : {
                    changes: 0,
                    insertions: 0,
                    deletions: 0
                }
            };
            commitData = /\[([^\s]+) ([^\]]+)/.exec(lines.shift());
            if (commitData){
                commitSummary.branch = commitData[1];
                commitSummary.commit = commitData[2];
            }
            commitData = /(\d+)[^,]*(?:,\s*(\d+)[^,]*)?(?:,\s*(\d+))?/g.exec(lines.shift());
            if (commitSummary.branch && commitData) {
                commitSummary.summary.changes = commitData[1] || 0;
                commitSummary.summary.insertions = commitData[2] || 0;
                commitSummary.summary.deletions = commitData[3] || 0;
            }
            return commitSummary;
        });
    }

    /**
     * Pull the updated contents of the current repo
     * @param {string} [remote]
     * @param {string} [branch]
     * @param {Function} [then]
     */
    pull(remote?, branch?) {
        var command = ["pull"];
        if (typeof remote === 'string' && typeof branch === 'string') {
            command.push(remote, branch);
        }
        return this._run(command);
    }

    /**
     * Fetch the updated contents of the current repo.
     *
     * @example
     *   .fetch('upstream', 'master') // fetches from master on remote named upstream
     *   .fetch(function () {}) // runs fetch against default remote and branch and calls function
     *
     * @param {string} [remote]
     * @param {string} [branch]
     * @param {Function} [then]
     */
    fetch(remote, branch) {
        var command = ["fetch"];
        if (typeof remote === 'string' && typeof branch === 'string') {
            command.push(remote, branch);
        }
        return this._run(command);
    }

    /**
     * Disables/enables the use of the console for printing warnings and errors, by default messages are not shown in
     * a production environment.
     *
     * @param {boolean} silence
     * @returns {Git}
     */
    /*silent(silence) {
        this._silentLogging = !!silence;
        return this;
    }*/

    /**
     * List all tags
     *
     * @param {Function} [then]
     */
    tags() {
        return this._run(['tag','-l']).then((data)=>{
            var list = data.split('\n').map(function (item) {
                return item.trim();
            }).filter(t=>!!t).sort(function (tagA, tagB) {
                var partsA = tagA.split('.');
                var partsB = tagB.split('.');
                for (var i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
                    var diff = partsA[i] - partsB[i];
                    if (diff) {
                        return diff > 0 ? 1 : -1;
                    }
                }
                return 0;
            });
            if(list && list.length){
                return {
                    latest : list[list.length - 1],
                    tags   : list
                }
            }
        });
    }

    /**
     * List all branches
     *
     * @param {Function} [then]
     */
    branches() {
        return this._run(['branch']).then((data)=>{
            var current;
            var list = data.split('\n').map((item)=>{
                item = item.trim();
                if(item[0]=='*'){
                    item = item.replace(/\*\s+(.*)/,'$1');
                    current = item;
                }
                return item;
            }).filter(t=>!!t);
            if(list && list.length){
                return {
                    current  : current,
                    branches : list
                }
            }
        });
    }

    /**
     * Reset a repo
     *
     * @param {string} [mode=soft] Either 'soft' or 'hard'
     * @param {Function} [then]
     */
    /*reset(mode, then) {
        var resetMode = '--' + (mode === 'hard' ? mode : 'soft');
        var next = (typeof arguments[arguments.length - 1] === "function") ? arguments[arguments.length - 1] : null;
        return this._run(['reset', resetMode], function (err) {
            next && next(err || null);
        });
    }*/

    /**
     * Add a lightweight tag to the head of the current branch
     *
     * @param {string} name
     * @param {Function} [then]
     */
    addTag(name) {
        if (typeof name !== "string") {
            return Promise.reject(new TypeError("Git.addTag requires a tag name"));
        }else{
            return this._run(['tag',name]);
        }
    }

    /**
     * Remove local tag from the head of the current branch
     *
     * @param {string} name
     * @param {Function} [then]
     */
    removeTag(name){
        if (typeof name !== "string") {
            return Promise.reject(new TypeError("Git.removeTag requires a tag name"));
        }else{
            return this._run(['tag','-d',name]);
        }
    }

    /**
     * Add an annotated tag to the head of the current branch
     *
     * @param {string} tagName
     * @param {string} tagMessage
     * @param {Function} [then]
     */
    /*addAnnotatedTag(tagName, tagMessage, then) {
        return this.tag(['-a', '-m', tagMessage, tagName], function (err) {
            then && then(err);
        });
    }*/

    /**
     * Check out a tag or revision
     *
     * @param {string} what
     * @param {Function} [then]
     */
    checkout(what) {
        return this._run(['checkout', what]).then(data=>true);
    }

    /**
     * Check out a remote branch
     *
     * @param {string} branchName name of branch
     * @param {string} startPoint (e.g origin/development)
     * @param {Function} [then]
     */
    /*checkoutBranch(branchName, startPoint, then) {
        return this._run(['checkout', '-b', branchName, startPoint], function (err, data) {
            then && then(err, !err && this._parseCheckout(data));
        });
    };*/

    /**
     * Check out a local branch
     *
     * @param {string} branchName of branch
     * @param {Function} [then]
     */
    addBranch(branchName) {
        return this._run(['checkout', '-b', branchName]);
    }

    /**
     * Add a submodule
     *
     * @param {string} repo
     * @param {string} path
     * @param {Function} [then]
     */
    /*submoduleAdd(repo, path, then) {
        return this._run(['submodule', 'add', repo, path], function (err) {
            then && then(err);
        });
    }*/

    /**
     * List remote
     *
     * @param {string[]} [args]
     * @param {Function} [then]
     */
    listRemote() {
        return this._run(['ls-remote']);
    }

    /**
     * Adds a remote to the list of remotes.
     *
     * @param {string} remoteName Name of the repository - eg "upstream"
     * @param {string} remoteRepo Fully qualified SSH or HTTP(S) path to the remote repo
     * @param {Function} [then]
     * @returns {*}
     */
    addRemote(remoteName, remoteRepo) {
        return this._run(['remote', 'add', remoteName, remoteRepo]);
    }

    /**
     * Removes an entry from the list of remotes.
     *
     * @param {string} remoteName Name of the repository - eg "upstream"
     * @param {Function} [then]
     * @returns {*}
     */
    removeRemote(remoteName) {
        return this._run(['remote', 'remove', remoteName]);
    }

    /**
     * Gets the currently available remotes, setting the optional verbose argument to true includes additional
     * detail on the remotes themselves.
     *
     * @param {boolean} [verbose=false]
     * @param {Function} [then]
     */
    getRemotes() {
        var args = ['remote','-v'];
        return this._run(args).then((data)=>{
            return data.trim().split('\n').reduce(function(remotes, remote) {
                var detail = remote.trim().split(/\s+/);
                var name = detail.shift();

                if (!remotes[name]) {
                    remotes[name] = remotes[remotes.length] = {
                        name: name,
                        refs: {}
                    };
                }

                if (detail.length) {
                    remotes[name].refs[detail.pop().replace(/[^a-z]/g, '')] = detail.pop();
                }

                return remotes;
            }, []).slice(0);
        });
    }

    /**
     * Call any `git remote` function with arguments passed as an array of strings.
     *
     * @param {string[]} options
     * @param {Function} [then]
     */
    /*remote(options, then) {
        if (!Array.isArray(options)) {
            return this.then(function () {
                then && then(new TypeError("Git.remote requires an array of arguments"));
            });
        }

        if (options[0] !== 'remote') {
            options.unshift('remote');
        }

        return this._run(options, function (err, data) {
            then && then(err || null, err ? null : data);
        });
    }*/



    /**
     * Pushes the current committed changes to a remote, optionally specify the names of the remote and branch to use
     * when pushing.
     *
     * @param {string} [remote]
     * @param {string} [branch]
     * @param {Function} [then]
     */
    push(remote?, branch?) {
        var command = ["push"];
        if (typeof remote === 'string' && typeof branch === 'string') {
            command.push(remote, branch);
        }
        return this._run(command);
    }

    /**
     * Pushes the current tag changes to a remote which can be either a URL or named remote. When not specified uses the
     * default configured remote spec.
     *
     * @param {string} [remote]
     * @param {Function} [then]
     */
    /*pushTags(remote, then) {
        var command = ['push'];
        if (typeof remote === "string") {
            command.push(remote);
        }
        command.push('--tags');

        then = typeof arguments[arguments.length - 1] === "function" ? arguments[arguments.length - 1] : null;

        return this._run(command, function (err, data) {
            then && then(err, !err && data);
        });
    }*/

    /**
     * Removes the named files from source control.
     *
     * @param {string|string[]} files
     * @param {Function} [then]
     */
    /*rm(files, then) {
        return this._rm(files, '-f', then);
    }*/

    /**
     * Removes the named files from source control but keeps them on disk rather than deleting them entirely. To
     * completely remove the files, use `rm`.
     *
     * @param {string|string[]} files
     * @param {Function} [then]
     */
    /*rmKeepLocal(files, then) {
        return this._rm(files, '--cached', then);
    }*/

    /**
     * Return repository changes.
     *
     * @param {string} [options]
     * @param {Function} [then]
     */
    /*diff(options, then) {
        var command = ['diff'];

        if (typeof options === 'string') {
            command[0] += ' ' + options;
            this._getLog('warn',
                'Git#diff: supplying options as a single string is now deprecated, switch to an array of strings');
        }
        else if (Array.isArray(options)) {
            command.push.apply(command, options);
        }

        if (typeof arguments[arguments.length - 1] === 'function') {
            then = arguments[arguments.length - 1];
        }

        return this._run(command, function (err, data) {
            then && then(err, data);
        });
    }*/

    /**
     * rev-parse.
     *
     * @param {string|string[]} [options]
     * @param {Function} [then]
     */
    /*revparse(options, then) {
        var command = ['rev-parse'];

        if (typeof options === 'string') {
            command = command + ' ' + options;
            this._getLog('warn',
                'Git#revparse: supplying options as a single string is now deprecated, switch to an array of strings');
        }
        else if (Array.isArray(options)) {
            command.push.apply(command, options);
        }

        if (typeof arguments[arguments.length - 1] === 'function') {
            then = arguments[arguments.length - 1];
        }

        return this._run(command, function (err, data) {
            then && then(err, data);
        });
    }*/

    /**
     * Show various types of objects, for example the file at a certain commit
     *
     * @param {string} [options]
     * @param {Function} [then]
     */
    /*show(options, then) {
        var args = [].slice.call(arguments, 0);
        var handler:Function = typeof args[args.length - 1] === "function" ? args.pop() : null;
        var command = ['show'];
        if (typeof options === 'string') {
            command = command + ' ' + options;
            this._getLog('warn',
                'Git#show: supplying options as a single string is now deprecated, switch to an array of strings');
        }
        else if (Array.isArray(options)) {
            command.push.apply(command, options);
        }

        return this._run(command, function (err, data) {
            handler && handler(err, !err && data);
        });
    }*/

    /**
     * Show commit logs.
     *
     * @param {Object} [options]
     * @param {string} [options.from] The first commit to include
     * @param {string} [options.to] The most recent commit to include
     * @param {string} [options.file] A single file to include in the result
     *
     * @param {Function} [then]
     */
    log(options?) {

        var command = ["log", "--pretty=format:'%H;%ai;%s%d;%aN;%ae'"];
        var opt:any = {};

        var args = [].slice.call(arguments, 0);

        if (!args.length) {
            opt = {};
        }
        else if (typeof args[0] === "object") {
            opt = args[0];
        }
        else if (typeof args[0] === "string" || typeof args[1] === "string") {
            opt = {
                from    : args[0],
                to      : args[1]
            };
        }

        if (opt.from && opt.to) {
            command.push(opt.from + "..." + opt.to);
        }

        if (opt.file) {
            command.push("--follow", options.file);
        }

        if (opt.n || opt['max-count']) {
            command.push("--max-count=" + (opt.n || opt['max-count']));
        }

        return this._run(command).then(data=>this._parseListLog(data));
    }


}

