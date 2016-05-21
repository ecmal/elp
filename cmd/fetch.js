system.register("elp/cmd/fetch", ['./command', "../models/library", "../models/url", "../models/registry"], function(system,module) {
    var command_1, command_2, command_3, library_1, url_1, registry_1;
    var Fetch = (function (__super) {
        Fetch.prototype.execute = function (url) {
            if (url_1.Url.isValid(url)) {
                library_1.Library.get(url).install();
            }
        };
        Fetch.__initializer = function(__parent){
            __super=__parent;
        };
        Fetch.__decorator = function(__decorate,__type){
            __decorate(142,"url",8,url_1.Url,null,null,null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["url",0,String]
            ]);
            Fetch = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Fetch Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp fetch [options] alias=registry:project@version\n    "]
                }]
            ], null,null);
        };
        return Fetch;
        function Fetch() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Fetch);
    module.export("Fetch", Fetch);
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
            Fetch = module.init(Fetch,command_3.Cli);
        }
    }
});
//# sourceMappingURL=fetch.js.map