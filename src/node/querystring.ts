let QS = require('querystring');

/**
 * The querystring.escape() method performs URL percent-encoding 
 * on the given string in a manner that is optimized for the 
 * specific requirements of URL query strings.
 * @param string string to escape 
 */
export function escape(string: string): string {
    return QS.escape(string);
}

/**
 * The querystring.unescape() method performs decoding of URL 
 * percent-encoded characters on the given string.
 * @param string string to escape 
 */
export function unescape(string): string {
    return QS.unescape(string);
}

/**
* 
* @param str String to parse
* @param pairs pairs separator
* @param values values separator  
* @param decoder The function to use when decoding percent-encoded characters in the query string. Defaults to decodeURIComponent.
* @param maxKeys Specifies the maximum number of keys to parse. Defaults to 1000. Specify 0 to remove key counting limitations.
* @return 
*/
export function decode(string: string, pairs = '&', values = '=', decoder = decodeURIComponent, maxKeys = 1000): object {
    return QS.parse(string, pairs, values, { decodeURIComponent: decoder, maxKeys })
}

/**
 * 
 * @param object The object to serialize into a URL query string
 * @param pairs The substring used to delimit key and value pairs in the query string. Defaults to '&'.
 * @param values The substring used to delimit keys and values in the query string. Defaults to '='.
 * @param encoder The function to use when converting URL-unsafe characters to percent-encoding in the query string. Defaults to encodeURIComponent.
 */
export function encode(object: object, pairs = '&', values = '=', encoder = encodeURIComponent): string {
    return QS.stringify(object, pairs, values, { encodeURIComponent: encoder })
}

export const Qs = {encode,decode,escape,unescape}
export default Qs;