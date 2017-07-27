class Test {

    /**
     * Hello World
     * @param {number} one
     */
    constructor(private one = 56) {
        console.info("One")
    }

    /**
     * Do something here
     * @param {string} hello
     * @returns {number}
     */
    something(hello:string):number{
        return 56
    }
}

export function main() {
    console.info(new Test(5));
}