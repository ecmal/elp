import * as React from "@ecmal/react/dom";

import { MainComponent } from "./pages/main";

declare const document, window;

export function render() {
    React.render(MainComponent.get({
        message: "Hello World"
    }), document.getElementById('root'));
}

export function main() {
    if (!document.body) {
        window.onload = render
    }else{
        render();
    }
}
