async function wait(sec) {
    return new Promise((accept) => setTimeout(accept, sec * 1000));
}

async function* random(sec) {
    let i=10000;
    while (i--) {
        await wait(sec);
    }
    console.info("WTF");
}

class Random implements AsyncIterableIterator<number>{
    constructor(private timeout=10){}

    async next(value?: any): Promise<IteratorResult<number>> {
        await wait(this.timeout);
        return {value:Math.random(),done:false};
    }
    async return(value?: any): Promise<IteratorResult<number>> {
        return Promise.resolve({value:value,done:true})
    }
    async throw(value?: any): Promise<IteratorResult<number>> {
        return Promise.resolve({value:value,done:true})
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    
}

async function test() {
    let rand = new Random(1);
    let gen = rand[Symbol.asyncIterator]();
    for await (const number of rand) {
        console.log(number);
        if (number > 0.8) {
            rand.throw(new Error('AAAA'))
            break;
        }
    }
}


export async function main() {
    console.info("Barev")
    try {
        await test();
    } catch (ex) {
        console.error(ex);
    }
}

