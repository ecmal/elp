import { HttpRoute } from "./server";
import { Mirror } from '@ecmal/runtime/reflect';
import { Resource } from "./resource";


const ROUTE = Symbol();

export function Route(path: string): ClassDecorator {
    return route(path)
}
export function Produce(type: string): ClassDecorator {
    return (target, key?, desc?) => {
        console.info(`Produce`, type, target.name)
    }
}
export function Consume(type: string): ClassDecorator {
    return (target, key?, desc?) => {
        console.info(`Consume`, type, target.name)
    }
}
export function route(path: string) {
    return (target, key?, desc?) => {
        Rest.register(path, target, key);
    }
}
export function Method(method, target, key, desc) {
    let mirror = Mirror.get(target, key);
    if (mirror.isMethod()) {
        let route = mirror.getMetadata(ROUTE) || {};
        route.method = method;
        mirror.setMetadata(ROUTE, route);
    } else {
        throw new Error(`cannot apply path to property ${key} of ${target.name}`);
    }
}
export function GET(target, key, desc) {
    Method('GET', target, key, desc);
}
export function POST(target, key, desc) {
    Method('POST', target, key, desc);
}
export function PUT(target, key, desc) {
    Method('PUT', target, key, desc);
}
export function DELETE(target, key, desc) {
    Method('DELETE', target, key, desc);
}
export function OPTIONS(target, key, desc) {
    Method('OPTIONS', target, key, desc);
}
export function param(property: string) {
    return <any>Param('params', property);
}
export function query(property: string) {
    return <any>Param('query', property);
}

function Param(pointer: string, property: string) {
    return (target, key?, index?) => {
        let mirror = Mirror.get(target, key, index);
        if (mirror.isField()) {
            return {
                enumerable: true,
                configurable: true,
                get: function () {
                    return this.url[pointer][property];
                },
                set: function (v) {
                    this.url[pointer][property] = v;
                }
            }
        }
        if (mirror.isParameter()) {
            mirror.setMetadata('argument', {
                pointer,
                property
            });
        } else {
            throw new Error(`cannot apply param to property ${key} of ${target.name}`);
        }
    }
}

class Rest<T extends Resource> {
    static register(path, target, key) {
        if (path == '*') {
            return (
                this.register('/', target, key),
                this.register('/:path(*)', target, key)
            );
        }
        return new Rest(path, target, key);
    }
    constructor(
        private path: string,
        private target: Constructor<T>,
        key
    ) {
        let mirror = Mirror.get(target, key);
        if (mirror.isClass()) {
            this.defineClassRoute();
        } else
            if (mirror.isMethod()) {
                if (mirror.isStatic()) {
                    throw new Error(`cannot apply path to static member ${key} of ${mirror.getClass().getName()}`);
                } else {
                    this.defineMethodRoute(key);
                }
            } else {
                throw new Error(`cannot apply path to property ${key} of ${target.name}`);
            }
    }
    private defineMethodRoute(key) {
        let mirror = Mirror.get(this.target, key);
        let route = mirror.getMetadata(ROUTE) || {};
        route.path = this.path;
        mirror.setMetadata(ROUTE, route);
    }
    private defineClassRoute() {
        let members = Mirror.get(this.target).getPrototype().getMembers();
        members.forEach(member => {
            if (member.isMethod()) {
                let route = member.getMetadata(ROUTE),
                    name = member.getName();
                if (route[route.method]) {
                    return this.defineRoute(name, {
                        method: route.method
                    })
                }
                if (route.action || (route.path && route.path.indexOf(route.method) < 0)) {
                    return this.defineRoute(name, {
                        method: route.method,
                        path: route.path && route.path.indexOf(route.method) == 1 ? void 0 : route.path
                    });
                }
                this.defineRoute(name, route);
            }
        })
    }
    private defineRoute(key, route) {
        route.path = `${this.path}${route.path ? '/' + route.path : ''}`;
        let node = HttpRoute.define(route.path);
        let data = node.data || (node.data = {});
        let target = this.target;
        data[route.method] = {
            id: `${target.name}.${key}`,
            name : key,
            method: route.method,
            path: route.path,
            controller : target,
            action(url, body, request, response, setup?:(instance, key, args, mirror)=>any){
                let mirror = Mirror.get(target, key);
                if (mirror && mirror.isMethod()) {
                    let args = [];
                    mirror.getParameters().forEach(parameter => {
                        let argument = parameter.getMetadata('argument');
                        if (argument) {
                            args[parameter.getIndex()] = url[argument.pointer][argument.property];
                        }
                    })
                    let controller = Object.create(target.prototype, {
                        constructor: { value: target },
                        url: { value: url },
                        body: { value: body },
                        request: { value: request },
                        response: { value: response }
                    });
                    if(typeof setup =='function'){
                        controller = setup(controller, key, args, mirror) || controller;
                    }
                    controller = target.call(controller) || controller;
                    return controller[key].apply(controller, args);
                }else{
                    throw new Error('route must be a function')
                }
            }
        };
    }
}
