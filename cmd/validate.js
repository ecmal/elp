system.register("elp/cmd/validate", ['./command', "../utils/fs", "../utils/gitignore"], function(system,module) {
    var command_1, command_2, fs_1, gitignore_1;
    var Validate = (function (__super) {
        Validate.prototype.execute = function (path) {
            if (path === void 0) { path = this.cwd; }
            var ignoreFile = fs_1.FileSystem.resolve(path, '.gitignore');
            if (fs_1.FileSystem.isFile(ignoreFile)) {
                var gi = new gitignore_1.GitIgnore(fs_1.FileSystem.readFile(ignoreFile).toString());
                console.info(gi.denies('out'));
            }
        };
        Validate.__initializer = function(__parent){
            __super=__parent;
        };
        Validate.__decorator = function(__decorate,__type){
            __decorate(144,"execute",0,Function,void 0,null,[
                ["path",2,String]
            ]);
            Validate = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Validate Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp validate [options]\n    "]
                }]
            ], null,null);
        };
        return Validate;
        function Validate() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Validate);
    module.export("Validate", Validate);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (gitignore_1_1) {
                gitignore_1 = gitignore_1_1;
            }],
        execute: function() {
            Validate = module.init(Validate,command_2.Cli);
        }
    }
});
//# sourceMappingURL=validate.js.map