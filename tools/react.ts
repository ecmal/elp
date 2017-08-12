import {Http} from "./utils/http";
import {Files} from "./utils/fs";
import {process} from "./utils/node";

declare const __dirname: string;
const reactVersion = '15.6.1';
const libPath = Files.resolve(__dirname, '../out/@ecmal/react');
const dirName = Files.resolve(__dirname, './react');

const tsBase = (p, v, f) => `https://unpkg.com/${p}@${v}/dist/${f}.min.js`;

function wrap(id,dep,source){
    return [
        `System.register(${JSON.stringify(id)}, ${JSON.stringify(dep)}, function (exporter, module, require, exports, __filename, __dirname) {`,
        source,
        `})`
    ].join('\n');
}

async function compileReactCore() {
    let source = await Http.get(tsBase('react', reactVersion, 'react'));
    source = wrap("@ecmal/react/react",[], source);
    Files.write(Files.resolve(libPath, 'react.js'),source);
}
async function compileReactDom() {
    let source = await Http.get(tsBase('react-dom', reactVersion, 'react-dom'));
    source = source.replace(/require\(["']react["']\)/m,'System.require("@ecmal/react/react")');
    source = wrap("@ecmal/react/dom",["@ecmal/react/react"], source);
    Files.write(Files.resolve(libPath, 'dom.js'),source);
}
async function compileReactServer() {
    let source = await Http.get(tsBase('react-dom', reactVersion, 'react-dom-server'));
    source = source.replace(/require\(["']react["']\)/m,'System.require("@ecmal/react/react")');
    source = wrap("@ecmal/react/server",["@ecmal/react/react"], source);
    Files.write(Files.resolve(libPath, 'server.js'),source);
}
async function copyDefinitions() {
    Files.readDirSync(dirName).forEach(f=>{
        Files.write(Files.resolve(libPath,f),Files.read(Files.resolve(dirName,f)));
    });
}

async function main(){
    try{
        await compileReactCore();
        await compileReactDom();
        await compileReactServer();
        await copyDefinitions();
    }catch(ex){
        console.error(ex);
    }
}

main();