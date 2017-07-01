import { Four } from "./four";
import { One } from "./one";
console.info("execute three.js")
export class Three extends Four {
    static getOne(){
        return Object.create(One.prototype);
    }
    public constructor(){
        super();
    }
    public toString(){
        this.one.toString();
    }
}