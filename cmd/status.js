system.register("elp/cmd/status", ['./command', "../utils/fs", "../compiler/compiler", "../models/package", "../models/registry", "../utils/git"], function(system,module) {
    var command_1, command_2, command_3, fs_1, compiler_1, package_1, registry_1, git_1;
    var Status = (function (__super) {
        Status.prototype.execute = function (path) {
            if (path === void 0) { path = this.cwd; }
            var pack = package_1.Package.read(path);
            var repo = new git_1.Repository(pack.dirname);
            //var regs = Registry.all();
            //var status  = repo.status();
            //var remotes = repo.remotes();
            var refs = repo.refs();
            console.info(refs);
            /*var log = repo.log();
            var regs = Object.keys(remotes).map(k=>{
                for(var r of regs){
                    if(r.matches(remotes[k].url)){
                        remotes[k].registry = r.id;
                        return r;
                    }
                }
            });
            console.info(regs);
            console.info(refs);
            console.info(status);
            console.info(remotes);
            console.info(log);*/
        };
        Status.__initializer = function(__parent){
            __super=__parent;
        };
        Status.__decorator = function(__decorate,__type){
            __decorate(144,"execute",0,Function,void 0,null,[
                ["path",2,String]
            ]);
            Status = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Status Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp status [options] alias=registry:project@version\n    "]
                }]
            ], null,null);
        };
        return Status;
        function Status() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Status);
    module.export("Status", Status);
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
            function (package_1_1) {
                package_1 = package_1_1;
            },
            function (registry_1_1) {
                registry_1 = registry_1_1;
            },
            function (git_1_1) {
                git_1 = git_1_1;
            }],
        execute: function() {
            Status = module.init(Status,command_3.Cli);
        }
    }
});
//# sourceMappingURL=status.js.map