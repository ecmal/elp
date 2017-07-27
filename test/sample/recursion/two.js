System.register("recursion/two", ["./five"], function (exporter, module, require, exports, __filename, __dirname) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __moduleName = module && module.id;
    var five_1, Two;
    return {
        setters: [
            function (five_1_1) {
                five_1 = five_1_1;
            }
        ],
        execute: function () {
            console.info("execute two.js");
            Two = (function (_super) {
                __extends(Two, _super);
                function Two() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Two.getTwo = function () {
                    return new Two();
                };
                return Two;
            }(five_1.Five));
            exporter("Two", Two);
        }
    };
});
