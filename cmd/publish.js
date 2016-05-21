system.register("elp/cmd/publish", ['./command', "../models/project"], function(system,module) {
    var command_1, command_2, command_3, project_1;
    var Publish = (function (__super) {
        Publish.prototype.execute = function (path) {
            if (path === void 0) { path = this.cwd; }
            project_1.Project.read(path).publish(this.force);
        };
        Publish.__initializer = function(__parent){
            __super=__parent;
        };
        Publish.__decorator = function(__decorate,__type){
            __decorate(142,"force",16,Boolean,null,[
                [command_2.Option,{
                    alias: 'f',
                    title: 'Force to publish'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["path",2,String]
            ]);
            Publish = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Install Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp publish [options] alias=registry:project@version\n    |\n    Examples :\n    |  elp install -s node=github:ecmal/node@4.5.0\n    |  elp install npm:angular\n    "]
                }]
            ], null,null);
        };
        return Publish;
        function Publish() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Publish);
    module.export("Publish", Publish);
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
            Publish = module.init(Publish,command_3.Cli);
        }
    }
});
//# sourceMappingURL=publish.js.map