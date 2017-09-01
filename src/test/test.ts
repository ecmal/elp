export async function* hello(){
    for await (let i of []){
        mello(i);
    }
}
export async function mello(i){
    return i
}