import { Http } from "./utils/http";
import { Files } from "./utils/fs";
import { process } from "./utils/node";

declare const __dirname:string;

const tsVersion = process.argv[2] || '2.5.0-dev.20170627';
const tsPath = Files.resolve('./out/lib');
const tsBase = `https://unpkg.com/typescript@${tsVersion}/lib`;

let files = [
    "cancellationToken.js",
    //"lib.d.ts",
    //"lib.dom.d.ts",
    //"lib.dom.iterable.d.ts",
    "lib.es2015.collection.d.ts",
    "lib.es2015.core.d.ts",
    "lib.es2015.d.ts",
    "lib.es2015.generator.d.ts",
    "lib.es2015.iterable.d.ts",
    "lib.es2015.promise.d.ts",
    "lib.es2015.proxy.d.ts",
    "lib.es2015.reflect.d.ts",
    "lib.es2015.symbol.d.ts",
    "lib.es2015.symbol.wellknown.d.ts",
    "lib.es2016.array.include.d.ts",
    "lib.es2016.d.ts",
    //"lib.es2016.full.d.ts",
    "lib.es2017.d.ts",
    //"lib.es2017.full.d.ts",
    "lib.es2017.intl.d.ts",
    "lib.es2017.object.d.ts",
    "lib.es2017.sharedmemory.d.ts",
    "lib.es2017.string.d.ts",
    "lib.es5.d.ts",
    //"lib.es6.d.ts",
    "lib.esnext.asynciterable.d.ts",
    "lib.esnext.d.ts",
    //"lib.esnext.full.d.ts",
    //"lib.scripthost.d.ts",
    //"lib.webworker.d.ts",
    "protocol.d.ts",
    "tsc.js",
    "tsserver.js",
    "tsserverlibrary.d.ts",
    "tsserverlibrary.js",
    "typescript.d.ts",
    "typescript.js",
    //"typescriptServices.d.ts",
    //"typescriptServices.js",
    "typingsInstaller.js",
    "watchGuard.js"
]

async function download(name) {
    return {
        name: name,
        lib: name.indexOf('lib.') === 0,
        source: await Http.get(`${tsBase}/${name}`),
        remote: `${tsPath}/${name}`,
        local: `${tsPath}/${name}`
    }
}
async function main() {
    let sources = await Promise.all(files.map(f => download(f)));
    let libs = [];
    sources.map(s => {
        if (s.lib) {
            libs.push(s.source)
        } else {
            Files.write(s.local, s.source);
        }
    });
    libs.push(Files.read(`${__dirname}/patch/lib.d.ts`));
    Files.write(`${tsPath}/lib.d.ts`, libs.join('\n'));
    return true;
}

main().then(
    r => console.info(r),
    e => console.error(e)
);