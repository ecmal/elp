const ps = require('process');

export class Process {
    get argv():string[]{
        return ps.argv;
    }
}

export const process = new Process();
export default process;