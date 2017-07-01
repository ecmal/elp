System.register("@vendor/sample/recursion/four", ["./three", "./two"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __moduleName = module && module.id;
    var three_1, two_1, Four;
    return {
        setters: [
            function (three_1_1) {
                three_1 = three_1_1;
            },
            function (two_1_1) {
                two_1 = two_1_1;
            }
        ],
        execute: function () {
            console.info("execute four.js");
            Four = (function () {
                function Four() {
                    this.one = three_1.Three.getOne();
                    this.two = two_1.Two.getTwo();
                }
                Four.NAME = "FOUR";
                return Four;
            }());
            exporter("Four", Four);
        }
    };
});
//# sourceMappingURL=four.js.map