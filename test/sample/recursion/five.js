System.register("recursion/five", ["./four"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var four_1, Five;
    return {
        setters: [
            function (four_1_1) {
                four_1 = four_1_1;
            }
        ],
        execute: function () {
            Five = (function () {
                function Five() {
                    this.name = four_1.Four.NAME;
                }
                return Five;
            }());
            exporter("Five", Five);
        }
    };
});
