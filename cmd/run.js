system.register("elp/cmd/run", ['./command', "../models/project", "../utils/fs"], function(system,module) {
    var command_1, command_2, command_3, project_1, fs_1;
    var process, CP, RUN_SCRIPT;
    var Run = (function (__super) {
        Object.defineProperty(Run, "SM", {
            get: function () {
                if (typeof this['SourceMap'] == 'undefined') {
                    try {
                        this['SourceMap'] = system.node.require('source-map');
                    }
                    catch (e) {
                        this['SourceMap'] = false;
                    }
                }
                return this['SourceMap'];
            },
            enumerable: true,
            configurable: true
        });
        Run.prototype.mapFor = function (path, line, column) {
            var mapJson = this.maps[path];
            if (!mapJson) {
                var mapPath = fs_1.FileSystem.resolve(this.project.vendorDir, path + '.js.map');
                if (fs_1.FileSystem.isFile(mapPath)) {
                    mapJson = this.maps[path] = Run.SM.SourceMapConsumer(JSON.parse(fs_1.FileSystem.readFile(mapPath)));
                    var pos = mapJson.originalPositionFor({ line: line, column: column });
                    return pos.source + ":" + pos.line + ":" + pos.column;
                }
            }
            return path + ":" + line + ":" + column;
        };
        Object.defineProperty(Run.prototype, "regexp", {
            get: function () {
                if (!this['rx']) {
                    var basePath = this.project.vendorDir.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    this['rx'] = new RegExp(basePath + '\/([A-Z0-9\\/\\-_\\.]*)\.js:(\\d+):(\\d+)', 'i');
                }
                return this['rx'];
            },
            enumerable: true,
            configurable: true
        });
        Run.prototype.format = function (l) {
            if (Run.SM) {
                var match = l.match(this.regexp);
                if (match) {
                    return l.replace(match[0], this.mapFor(match[1], parseInt(match[2]), parseInt(match[3])));
                }
            }
            return l;
        };
        Run.prototype.execute = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var project = this.project = project_1.Project.read(this.cwd);
            var runFile = fs_1.FileSystem.resolve(project.vendorDir, project.name + ".js");
            fs_1.FileSystem.writeFile(runFile, RUN_SCRIPT.trim().replace('§MAIN§', this.test ? project.name + "/" + this.test : project.main));
            var child = CP.fork(runFile, args, {
                cwd: project.vendorDir,
                silent: true
            });
            var outFirst = true;
            var errFirst = true;
            child.stderr.on('data', function (data) {
                process.stderr.write(data.toString().split(/\n/).map(function (l, i) {
                    if (errFirst || i > 0) {
                        errFirst = false;
                        return "err | " + _this.format(l);
                    }
                    else {
                        return _this.format(l);
                    }
                }).join('\n'));
            });
            child.stdout.on('data', function (data) {
                process.stdout.write(data.toString().split(/\n/).map(function (l, i) {
                    if (outFirst || i > 0) {
                        outFirst = false;
                        return "out | " + _this.format(l);
                    }
                    else {
                        return _this.format(l);
                    }
                }).join('\n'));
            });
            child.on('close', function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                console.info.apply(console, ['close'].concat(args));
            });
        };
        Run.__initializer = function(__parent){
            __super=__parent;
        };
        Run.__decorator = function(__decorate,__type){
            __decorate(142,"watch",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'w',
                    title: 'Watch files for compilation'
                }]
            ],null);
            __decorate(142,"test",16,Boolean,null,[
                [command_2.Option,{
                    alias: 't',
                    args: '<module>',
                    title: 'Watch files for compilation'
                }]
            ],null);
            __decorate(142,"project",8,project_1.Project,null,null,null);
            __decorate(142,"maps",8,Object,null,null,null);
            __decorate(144,"mapFor",8,Function,void 0,null,[
                ["path",0,String],
                ["line",0,Number],
                ["column",0,Number]
            ]);
            __decorate(146,"regexp",8,RegExp,null,null,null);
            __decorate(144,"format",0,Function,void 0,null,[
                ["l",0,Object]
            ]);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["args",4,Object]
            ]);
            __decorate(146,"SM",1,Object,null,null,null);
            Run = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Run Project',
                    args: '[path]',
                    usage: ["\n    Usage :\n    |  elp compile [options] [path]\n    |\n    Examples :\n    |  elp compile\n    |  elp compile ./my-module\n    |  elp compile -o ./my/out/dir ./my-module/package.json\n    "]
                }]
            ], null,null);
        };
        return Run;
        function Run() {
            __super.apply(this, arguments);
            this.watch = false;
            this.test = false;
            this.maps = {};
        }
    })();
    module.define('class', Run);
    module.export("Run", Run);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
                command_3 = command_1_1;
            },
            function (project_1_1) {
                project_1 = project_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            process = system.node.process;
            CP = system.node.require('child_process');
            RUN_SCRIPT = "\nrequire('./runtime/package');\nSystem.import('\u00A7MAIN\u00A7').catch(function(e){\n    console.error(e.stack);\n    process.exit(1);\n});\n";
            Run = module.init(Run,command_3.Cli);
        }
    }
});
//# sourceMappingURL=run.js.map