system.register("elp/cmd/init", ['./command'], function(system,module) {
    var command_1, command_2, command_3;
    var Init = (function (__super) {
        Init.prototype.execute = function () {
            var packages = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                packages[_i - 0] = arguments[_i];
            }
            console.info(this.name, packages);
        };
        Init.__initializer = function(__parent){
            __super=__parent;
        };
        Init.__decorator = function(__decorate,__type){
            __decorate(142,"name",16,String,null,[
                [command_2.Option,{
                    alias: 'n',
                    args: 'name',
                    title: 'Save to package config ?'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["packages",4,Object]
            ]);
            Init = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Initialize Package',
                    usage: ["\n    Usage :\n    |  elp init [options]\n    |\n    Examples :\n    |  elp init -n my-app\n    "]
                }]
            ], null,null);
        };
        return Init;
        function Init() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Init);
    module.export("Init", Init);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
                command_3 = command_1_1;
            }],
        execute: function() {
            Init = module.init(Init,command_3.Cli);
        }
    }
});
//# sourceMappingURL=init.js.map