import {path} from './node';
import {fs} from './node';

export const Files = {
    resolve(...paths):string{
        return path.resolve(...paths);
    },
    write(path:string,data:string){
        fs.writeFileSync(createFile(path),data,{
            encoding:'utf8'
        })
    },
    read(path:string):string{
        return fs.readFileSync(path,'utf8');
    }
}

function createFile(file){
    const splitPath = path.dirname(path.resolve(file)).split('/');
    splitPath.reduce((path, subPath) => {
        let currentPath;
        if (subPath != '.') {
            currentPath = path + '/' + subPath;
            if (!fs.existsSync(currentPath)) {
                fs.mkdirSync(currentPath);
            }
        }
        else {
            currentPath = subPath;
        }
        return currentPath
    }, '')
    return file;
}