export default {
    first(obj) {
        return obj[0];
    },
    last(obj) {
        return obj[obj.length - 1];
    },
    capitalize(str){
        str = String(str);
        return str[0].toUpperCase() + str.substr(1, str.length);
    },
    downcase(str){
        return String(str).toLowerCase();
    },
    upcase(str){
        return String(str).toUpperCase();
    },
    sort(obj){
        return Object.create(obj).sort();
    },
    sort_by(obj, prop){
        return Object.create(obj).sort(function(a, b){
            a = a[prop], b = b[prop];
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        });
    },
    size(obj) {
        return obj.length;
    },
    plus(a, b){
        return Number(a) + Number(b);
    },
    minus(a, b){
        return Number(a) - Number(b);
    },
    times(a, b){
        return Number(a) * Number(b);
    },
    divided_by(a, b){
        return Number(a) / Number(b);
    },
    join(obj, str){
        return obj.join(str || ', ');
    },
    truncate(str, len, append){
        str = String(str);
        if (str.length > len) {
            str = str.slice(0, len);
            if (append) str += append;
        }
        return str;
    },
    truncate_words(str:string, n){
        str = String(str);
        var words = str.split(/ +/);
        return words.slice(0, n).join(' ');
    },
    replace(str, pattern, substitution){
        return String(str).replace(pattern, substitution || '');
    },
    prepend(obj, val){
        return Array.isArray(obj)
            ? [val].concat(obj)
            : val + obj;
    },
    append(obj, val){
        return Array.isArray(obj)
            ? obj.concat(val)
            : obj + val;
    },
    map(arr, prop){
        return arr.map(function(obj){
            return obj[prop];
        });
    },
    reverse(obj){
        return Array.isArray(obj)
            ? obj.reverse()
            : String(obj).split('').reverse().join('');
    },
    get(obj, prop){
        return obj && obj[prop];
    },
    json(obj){
        return JSON.stringify(obj);
    },
    escape(html){
        return String(html)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    }
}
