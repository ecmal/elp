system.register("elp/cmd/bundle", ['./command', "../utils/fs", "../compiler/compiler", "../models/project"], function(system,module) {
    var command_1, command_2, command_3, fs_1, compiler_1, project_1;
    var Bundle = (function (__super) {
        Bundle.prototype.execute = function (path) {
            if (path === void 0) { path = this.cwd; }
            project_1.Project.read(path).compile(false, this.file || 'bundle.js', !!this.executable);
        };
        Bundle.__initializer = function(__parent){
            __super=__parent;
        };
        Bundle.__decorator = function(__decorate,__type){
            __decorate(142,"file",16,String,null,[
                [command_2.Option,{
                    alias: 'f',
                    args: 'file',
                    title: 'Output directory'
                }]
            ],null);
            __decorate(142,"executable",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'e',
                    title: 'Output directory'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["path",2,String]
            ]);
            Bundle = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Compile Project',
                    args: '[path]',
                    usage: ["\n    Usage :\n    |  elp compile [options] [path]\n    |\n    Examples :\n    |  elp compile\n    |  elp compile ./my-module\n    |  elp compile -o ./my/out/dir ./my-module/package.json\n    "]
                }]
            ], null,null);
        };
        return Bundle;
        function Bundle() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Bundle);
    module.export("Bundle", Bundle);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
                command_3 = command_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (compiler_1_1) {
                compiler_1 = compiler_1_1;
            },
            function (project_1_1) {
                project_1 = project_1_1;
            }],
        execute: function() {
            Bundle = module.init(Bundle,command_3.Cli);
        }
    }
});
//# sourceMappingURL=bundle.js.map