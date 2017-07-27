System.register("recursion", ["./recursion/one", "./recursion/two"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var one_1, two_1;
    return {
        setters: [
            function (one_1_1) {
                one_1 = one_1_1;
            },
            function (two_1_1) {
                two_1 = two_1_1;
            }
        ],
        execute: function () {
            exporter("One", one_1.One);
            exporter("Two", two_1.Two);
        }
    };
});
