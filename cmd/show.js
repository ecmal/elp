system.register("elp/cmd/show", ['./command', "../models/library", "../models/url", "../models/registry"], function(system,module) {
    var command_1, command_2, command_3, library_1, url_1, registry_1;
    var Show = (function (__super) {
        Show.prototype.execute = function (url) {
            if (url_1.Url.isValid(url)) {
                console.info(library_1.Library.show(url));
            }
        };
        Show.__initializer = function(__parent){
            __super=__parent;
        };
        Show.__decorator = function(__decorate,__type){
            __decorate(142,"url",8,url_1.Url,null,null,null);
            __decorate(144,"execute",0,Function,void 0,null,[
                ["url",0,String]
            ]);
            Show = 
            __decorate(217, "constructor", null, null, null, [
                [command_1.Command,{
                    title: 'Show Package',
                    args: '<package,...>',
                    usage: ["\n    Usage :\n    |  elp show [options] alias=registry:project@version\n    "]
                }]
            ], null,null);
        };
        return Show;
        function Show() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Show);
    module.export("Show", Show);
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
            Show = module.init(Show,command_3.Cli);
        }
    }
});
//# sourceMappingURL=show.js.map