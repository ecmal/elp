System.register("recursion/one", ["./three"], function (exporter, module, require, exports, __filename, __dirname) {
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
    var three_1, One;
    return {
        setters: [
            function (three_1_1) {
                three_1 = three_1_1;
            }
        ],
        execute: function () {
            console.info("execute one.js");
            One = (function (_super) {
                __extends(One, _super);
                function One() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return One;
            }(three_1.Three));
            exporter("One", One);
        }
    };
});
