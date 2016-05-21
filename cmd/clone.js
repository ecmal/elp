system.register("elp/cmd/clone", ['./command', "../models/library", "../models/url", "../utils/fs"], function(system,module) {
    var command_1, command_2, library_1, url_1, fs_1;
    var process;
    var Clone = (function (__super) {
        Clone.prototype.execute = function (url, path) {
            if (url_1.Url.isValid(url)) {
                try {
                    var show = library_1.Library.show(url);
                    if (show) {
                        var dir = fs_1.default.resolve(process.cwd(), path || show.name);
                        var lib = library_1.Library.get(url);
                        if (!show.exist) {
                            lib.install(true);
                        }
                        lib.workdir(dir, show.source.name, show.registry + "/" + show.source.name);
                    }
                }
                catch (ex) {
                    console.info(ex.stack);
                }
            }
        };
        Clone.__initializer = function(__parent){
            __super=__parent;
        };
        Clone.__decorator = function(__decorate,__type){
            __decorate(144,"execute",0,Function,void 0,null,[
                ["url",0,String],
                ["path",1,String]
            ]);
            Clone = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Clone Package',
                    args: '<package,...>',
                    usage: ["\n    Usage  :\n    |  elp clone [options] [path]\n    "]
                }]
            ], null,null);
        };
        return Clone;
        function Clone() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Clone);
    module.export("Clone", Clone);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
            },
            function (library_1_1) {
                library_1 = library_1_1;
            },
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            }],
        execute: function() {
            process = system.node.process;
            Clone = module.init(Clone,command_2.Cli);
        }
    }
});
//# sourceMappingURL=clone.js.map