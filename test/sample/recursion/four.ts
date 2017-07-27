import { Three } from "./three";
import { One } from "./one";
import { Two } from "./two";
console.info("execute four.js")
export class Four {
    static NAME="FOUR";
    public one:One;
    public two:Two;
    public constructor(){
        this.one = Three.getOne();
        this.two = Two.getTwo();
    }
}