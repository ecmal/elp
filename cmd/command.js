system.register("elp/cmd/command", [], function(system,module) {
    var process, OPTIONS, COMMAND, COMMANDS;
    function Option(settings) {
        return function (target, key) {
            if (!settings.name) {
                settings.name = key;
            }
            var options = target.constructor[OPTIONS];
            if (!options) {
                options = target.constructor[OPTIONS] = {};
            }
            options[key] = settings;
        };
    }
    module.define('function', Option)
    module.export("Option", Option);
    function Command(settings) {
        if (!settings) {
            settings = {};
        }
        return function (target) {
            if (!settings.name) {
                settings.name = String(target.class.name)
                    .replace(/([A-Z])/g, function (a) { return '-' + a; })
                    .toLowerCase()
                    .replace(/\-(.*)/, '$1');
            }
            settings.options = target[OPTIONS] || {};
            delete target[OPTIONS];
            var parent = target.prototype.__proto__.constructor[COMMAND];
            if (parent && parent.options) {
                for (var i in parent.options) {
                    if (!settings.options[i]) {
                        settings.options[i] = parent.options[i];
                    }
                }
            }
            target[COMMAND] = settings;
            if (target.class.name != 'Cli') {
                COMMANDS.push(target);
            }
        };
    }
    module.define('function', Command)
    module.export("Command", Command);
    var Cli = (function (__super) {
        Cli.help = function () {
            var meta = this[COMMAND];
            var options = Object.keys(meta.options).map(function (option) {
                option = meta.options[option];
                return "  -\033[1m" + option.alias + "\033[0m, --\033[1m" + option.name + "\033[0m : " + option.title;
            });
            var commands = this != Cli ? [] : COMMANDS.map(function (c) { return c[COMMAND]; }).map(function (command) {
                return "   \033[1m" + command.name + "\033[0m : " + command.title;
            });
            var head = [], parent = this.prototype.__proto__.constructor[COMMAND];
            if (parent) {
                head.push(parent.name);
            }
            head.push(meta.name);
            if (options.length) {
                head.push('[options]');
            }
            if (commands.length) {
                head.push('<command>');
            }
            else if (meta.args) {
                head.push(meta.args);
            }
            var help = ['', head.join(' ')];
            if (options.length) {
                help.push('');
                help.push('Options : ');
                help.push.apply(help, options);
            }
            if (commands.length) {
                help.push('');
                help.push('Commands : ');
                help.push.apply(help, commands);
            }
            if (meta.usage) {
                if (Array.isArray(meta.usage)) {
                    meta.usage = meta.usage.join('\n');
                }
                help.push('');
                help.push(meta.usage.split('\n')
                    .filter(function (l) { return !!l; })
                    .map(function (l) { return l.replace(/(\s+\|?)(.*)/, '$2'); })
                    .join('\n'));
            }
            help.push('');
            return help.join('\n');
        };
        Cli.prototype.execute = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (this.version) {
                console.info(Cli.title + " " + Cli.version);
            }
            else if (this.help) {
                var Class = this.constructor;
                console.info(Class.help(Class));
            }
        };
        Cli.__decorator = function(__decorate,__type){
            __decorate(142,"help",16,Boolean,null,[
                [Option,{
                    alias: 'h',
                    title: 'Print help'
                }]
            ],null);
            __decorate(142,"version",16,Boolean,null,[
                [Option,{
                    alias: 'v',
                    required: true,
                    title: 'Print version'
                }]
            ],null);
            __decorate(142,"cwd",4,String,null,null,null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["args",4,Object]
            ]);
            __decorate(142,"title",1,String,null,null,null);
            __decorate(142,"version",1,String,null,null,null);
            __decorate(144,"help",1,Function,void 0,null,null);
            Cli = 
            __decorate(217, "constructor", null, null, null, [
                [Command]
            ], null,null);
        };
        return Cli;
        function Cli() {
            this.help = false;
            this.version = false;
        }
    })();
    module.define('class', Cli);
    module.export("Cli", Cli);
    return {
        setters:[],
        execute: function() {
            process = system.node.process;
            OPTIONS = Symbol();
            COMMAND = Symbol();
            COMMANDS = [];
            Cli = module.init(Cli);
            module.export("default",function (name, version) {
                process.title = name;
                Cli.title = name;
                Cli.version = version;
                Cli[COMMAND].name = name;
                var Command = Cli, args = process.argv.slice(2);
                for (var i = 0; i < args.length && Command == Cli; i++) {
                    var arg = args[i];
                    if (arg[0] != '-') {
                        for (var c = 0; c < COMMANDS.length; c++) {
                            if (COMMANDS[c][COMMAND].name == arg) {
                                args[i] = null;
                                Command = COMMANDS[c];
                            }
                        }
                    }
                }
                var meta = Command[COMMAND];
                var metaOptions = (function (options) {
                    var map = {};
                    for (var o in options) {
                        var option = options[o];
                        map[option.name] = option;
                        map[option.alias] = option;
                    }
                    return map;
                })(meta.options);
                var cmd = new Command(), params = [];
                for (var i = 0; i < args.length; i++) {
                    var key, metaOption, val, arg = args[i];
                    if (arg) {
                        if (arg[0] == '-') {
                            if (arg[1] == '-') {
                                key = arg.substring(2);
                            }
                            else {
                                key = arg[1];
                            }
                            metaOption = metaOptions[key];
                            if (metaOption) {
                                if (metaOption.args) {
                                    if (arg[1] == '-') {
                                        val = args[++i];
                                    }
                                    else {
                                        if (arg.length > 2) {
                                            val = arg.substring(2);
                                        }
                                        else {
                                            val = args[++i];
                                        }
                                    }
                                }
                                else {
                                    val = true;
                                }
                                cmd[metaOption.name] = val;
                            }
                            else {
                                console.info('invalid option ' + arg);
                            }
                        }
                        else {
                            params.push(arg);
                        }
                    }
                }
                cmd.cwd = process.cwd();
                if (cmd.version || cmd.help) {
                    Cli.prototype.execute.call(cmd);
                }
                else {
                    cmd.execute.apply(cmd, params);
                }
            });
        }
    }
});
//# sourceMappingURL=command.js.map