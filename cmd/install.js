system.register("elp/cmd/install", ['./command', "../models/project"], function(system,module) {
    var command_1, command_2, command_3, project_1;
    var Install = (function (__super) {
        Install.prototype.execute = function () {
            var packages = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                packages[_i - 0] = arguments[_i];
            }
            project_1.Project.read(this.cwd).install();
        };
        Install.__initializer = function(__parent){
            __super=__parent;
        };
        Install.__decorator = function(__decorate,__type){
            __decorate(142,"save",16,Boolean,null,[
                [command_2.Option,{
                    alias: 's',
                    title: 'Save to package config ?'
                }]
            ],null);
            __decorate(142,"saveDev",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'd',
                    title: 'Save to package config ?'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["packages",4,Object]
            ]);
            Install = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Install Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp install [options] alias=registry:project@version\n    |\n    Examples :\n    |  elp install -s node=github:ecmal/node@4.5.0\n    |  elp install npm:angular\n    "]
                }]
            ], null,null);
        };
        return Install;
        function Install() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Install);
    module.export("Install", Install);
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
            Install = module.init(Install,command_3.Cli);
        }
    }
});
//# sourceMappingURL=install.js.map