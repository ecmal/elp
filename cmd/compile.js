system.register("elp/cmd/compile", ['./command', "../models/project"], function(system,module) {
    var command_1, command_2, command_3, project_1;
    var Compile = (function (__super) {
        Compile.prototype.execute = function (path) {
            if (path === void 0) { path = this.cwd; }
            var project = project_1.Project.read(path);
            if (this.output) {
                project.dirs.vendor = this.output;
            }
            if (this.watch) {
                console.info("Watching  \"" + project.name + "\" into \"" + project.vendorDir + "\"");
                project.watch(this.tests);
            }
            else {
                console.info("Compiling \"" + project.name + "\" into \"" + project.vendorDir + "\"");
                project.compile(this.tests);
            }
        };
        Compile.__initializer = function(__parent){
            __super=__parent;
        };
        Compile.__decorator = function(__decorate,__type){
            __decorate(142,"watch",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'w',
                    title: 'Watch files for compilation'
                }]
            ],null);
            __decorate(142,"output",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'o',
                    args: 'dir',
                    title: 'Output directory'
                }]
            ],null);
            __decorate(142,"tests",16,Boolean,null,[
                [command_2.Option,{
                    alias: 't',
                    title: 'Include Tests'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["path",2,String]
            ]);
            Compile = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Compile Project',
                    args: '[path]',
                    usage: ["\n    Usage :\n    |  elp compile [options] [path]\n    |\n    Examples :\n    |  elp compile\n    |  elp compile ./my-module\n    |  elp compile -o ./my/out/dir ./my-module/package.json\n    "]
                }]
            ], null,null);
        };
        return Compile;
        function Compile() {
            __super.apply(this, arguments);
            this.watch = false;
            this.output = false;
            this.tests = false;
        }
    })();
    module.define('class', Compile);
    module.export("Compile", Compile);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
                command_3 = command_1_1;
            },
            function (project_1_1) {
                project_1 = project_1_1;
            }],
        execute: function() {
            Compile = module.init(Compile,command_3.Cli);
        }
    }
});
//# sourceMappingURL=compile.js.map