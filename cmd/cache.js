system.register("elp/cmd/cache", ['./command', "../models/library", "../models/url", "../models/registry"], function(system,module) {
    var command_1, command_2, command_3, library_1, url_1, registry_1;
    var Cache = (function (__super) {
        Cache.prototype.execute = function () {
            if (this.install) {
                if (url_1.Url.isValid(this.install)) {
                    library_1.Library.get(this.install).install();
                }
            }
            else if (this.remove) {
                if (url_1.Url.isValid(this.remove)) {
                    library_1.Library.get(this.remove).remove();
                }
            }
            else if (this.clear) {
                library_1.Library.clear();
            }
            else {
                library_1.Library.list().forEach(function (l) {
                    console.info(l.toString());
                });
            }
        };
        Cache.__initializer = function(__parent){
            __super=__parent;
        };
        Cache.__decorator = function(__decorate,__type){
            __decorate(142,"list",24,Boolean,null,[
                [command_2.Option,{
                    alias: 'l',
                    title: 'List packages'
                }]
            ],null);
            __decorate(142,"clear",24,Boolean,null,[
                [command_2.Option,{
                    alias: 'c',
                    title: 'List packages'
                }]
            ],null);
            __decorate(142,"install",24,String,null,[
                [command_2.Option,{
                    alias: 'i',
                    args: '<package>',
                    title: 'List packages'
                }]
            ],null);
            __decorate(142,"remove",24,String,null,[
                [command_2.Option,{
                    alias: 'r',
                    args: '<package>',
                    title: 'List packages'
                }]
            ],null);
            __decorate(144,"execute",0,Function,void 0,null,null);
            Cache = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Cached Management',
                    args: '[package]',
                    usage: ["\n    Usage :\n    |  elp cache -i registry:project@version\n    |  elp cache -r registry:project@version\n    |  elp cache -l\n    |  elp cache -c\n    "]
                }]
            ], null,null);
        };
        return Cache;
        function Cache() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Cache);
    module.export("Cache", Cache);
    return {
        setters:[
            function (command_1_1) {
                command_1 = command_1_1;
                command_2 = command_1_1;
                command_3 = command_1_1;
            },
            function (library_1_1) {
                library_1 = library_1_1;
            },
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (registry_1_1) {
                registry_1 = registry_1_1;
            }],
        execute: function() {
            Cache = module.init(Cache,command_3.Cli);
        }
    }
});
//# sourceMappingURL=cache.js.map