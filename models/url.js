system.register("elp/models/url", [], function(system,module) {
    var NREG, VREG, PREG, REGX;
    var Url = (function (__super) {
        Url.isValid = function (url) {
            return REGX.test(url);
        };
        Url.stringify = function (url) {
            if (!(url instanceof Url)) {
                url = new Url(url);
            }
            return url.toString();
        };
        Url.parse = function (url) {
            return new Url(url);
        };
        Url.prototype.parse = function (url) {
            var match = url.match(REGX);
            if (match) {
                this.registry = match[1] || this.registry;
                this.vendor = match[2] || this.vendor;
                this.project = match[3] || this.project;
                this.version = match[4] || this.version;
                this.stringify();
                return true;
            }
            else {
                return false;
            }
        };
        Url.prototype.stringify = function () {
            return this.url = "" + (this.registry ? this.registry + ':' : '') + (this.vendor ? this.vendor + '/' : '') + (this.project ? this.project : '') + ((this.vendor || this.project) && this.version ? '#' : '') + (this.version ? this.version : '');
        };
        Url.prototype.toString = function () {
            return "Lib(" + this.url + ")";
        };
        return Url;
        function Url(url, parent) {
            if (url && typeof url == 'string') {
                this.registry = parent ? parent.registry : null;
                this.vendor = parent ? parent.vendor : null;
                this.project = parent ? parent.project : null;
                this.version = parent ? parent.version : null;
                this.parse(url);
            }
            else if (url && typeof url == 'object') {
                this.registry = url.registry || parent.registry || null;
                this.vendor = url.vendor || parent.vendor || null;
                this.project = url.project || parent.project || null;
                this.version = url.version || parent.version || null;
            }
        }
    })();
    module.define('class', Url);
    module.export("Url", Url);
    return {
        setters:[],
        execute: function() {
            NREG = '[a-zA-Z][a-zA-Z0-9_$\\-\\.]*';
            VREG = 'v?[^]?(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*|x)\\.(?:0|[1-9][0-9]*|x)(?:-[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?(?:\\+[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?';
            PREG = "^(?:(" + NREG + "):)?(?:(" + NREG + ")/)?(" + NREG + ")?(?:#?(" + VREG + ")?)$";
            REGX = new RegExp(PREG, 'i');
            Url = module.init(Url);
        }
    }
});
//# sourceMappingURL=url.js.map