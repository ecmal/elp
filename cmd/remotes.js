system.register("elp/cmd/remotes", ['./command'], function(system,module) {
    var command_1, command_2;
    var Remotes = (function (__super) {
        Remotes.prototype.execute = function () {
        };
        Remotes.__initializer = function(__parent){
            __super=__parent;
        };
        Remotes.__decorator = function(__decorate,__type){
            __decorate(144,"execute",0,Function,void 0,null,null);
            Remotes = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Clone Package',
                    args: '<package,...>',
                    usage: ["\n    Usage  :\n    |  elp clone [options] [path]\n    "]
                }]
            ], null,null);
        };
        return Remotes;
        function Remotes() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Remotes);
    module.export("Remotes", Remotes);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
            }],
        execute: function() {
            Remotes = module.init(Remotes,command_2.Cli);
        }
    }
});
//# sourceMappingURL=remotes.js.map