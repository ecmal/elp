System.register("@vendor/sample/recursion", ["./recursion/one", "./recursion/two", "./recursion/three", "./recursion/four", "./recursion/five"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exporter(exports);
    }
    return {
        setters: [
            function (one_1_1) {
                exportStar_1(one_1_1);
            },
            function (two_1_1) {
                exportStar_1(two_1_1);
            },
            function (three_1_1) {
                exportStar_1(three_1_1);
            },
            function (four_1_1) {
                exportStar_1(four_1_1);
            },
            function (five_1_1) {
                exportStar_1(five_1_1);
            }
        ],
        execute: function () {
        }
    };
});
//# sourceMappingURL=recursion.js.map