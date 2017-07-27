import { Five } from "./five";
console.info("execute two.js")
export class Two extends Five {
    static getTwo(){
        return new Two()
    }
}