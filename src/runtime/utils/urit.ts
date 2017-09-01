export class Parser {

    protected encodeReserved(str) {
        return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {
            if (!/%[0-9A-Fa-f]/.test(part)) {
                part = encodeURI(part).replace(/%5B/g, '[').replace(/%5D/g, ']');
            }
            return part;
        }).join('');
    }

    protected encodeUnreserved(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }

    protected encodeValue(operator, value, key) {
        value = (operator === '+' || operator === '#') ? this.encodeReserved(value) : this.encodeUnreserved(value);

        if (key) {
            return this.encodeUnreserved(key) + '=' + value;
        } else {
            return value;
        }
    }

    protected isDefined(value) {
        return value !== undefined && value !== null;
    }

    protected isKeyOperator(operator) {
        return operator === ';' || operator === '&' || operator === '?';
    }

    protected getValues(context, operator, key, modifier) {
        let value = context[key],
            result = [];

        if (this.isDefined(value) && value !== '') {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                value = value.toString();

                if (modifier && modifier !== '*') {
                    value = value.substring(0, parseInt(modifier, 10));
                }

                result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
            } else {
                if (modifier === '*') {
                    if (Array.isArray(value)) {
                        value.filter(this.isDefined).forEach(function (value) {
                            result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
                        }, this);
                    } else {
                        Object.keys(value).forEach(function (k) {
                            if (this.isDefined(value[k])) {
                                result.push(this.encodeValue(operator, value[k], k));
                            }
                        }, this);
                    }
                } else {
                    let tmp = [];

                    if (Array.isArray(value)) {
                        value.filter(this.isDefined).forEach(function (value) {
                            tmp.push(this.encodeValue(operator, value));
                        }, this);
                    } else {
                        Object.keys(value).forEach(function (k) {
                            if (this.isDefined(value[k])) {
                                tmp.push(this.encodeUnreserved(k));
                                tmp.push(this.encodeValue(operator, value[k].toString()));
                            }
                        }, this);
                    }

                    if (this.isKeyOperator(operator)) {
                        result.push(this.encodeUnreserved(key) + '=' + tmp.join(','));
                    } else if (tmp.length !== 0) {
                        result.push(tmp.join(','));
                    }
                }
            }
        } else {
            if (operator === ';') {
                if (this.isDefined(value)) {
                    result.push(this.encodeUnreserved(key));
                }
            } else if (value === '' && (operator === '&' || operator === '?')) {
                result.push(this.encodeUnreserved(key) + '=');
            } else if (value === '') {
                result.push('');
            }
        }
        return result;
    }

    /**
     * @param template uri template to parse
     * @return compile function to format uri
     */
    public parse<T>(template): (t: T) => string {
        let that = this;
        let operators = ['+', '#', '.', '/', ';', '?', '&'];
        return function (context) {
            return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
                if (expression) {
                    let operator = null,
                        values = [];

                    if (operators.indexOf(expression.charAt(0)) !== -1) {
                        operator = expression.charAt(0);
                        expression = expression.substr(1);
                    }

                    expression.split(/,/g).forEach(function (variable) {
                        let tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
                        values.push.apply(values, that.getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
                    });

                    if (operator && operator !== '+') {
                        let separator = ',';

                        if (operator === '?') {
                            separator = '&';
                        } else if (operator !== '#') {
                            separator = operator;
                        }
                        return (values.length !== 0 ? operator : '') + values.join(separator);
                    } else {
                        return values.join(',');
                    }
                } else {
                    return that.encodeReserved(literal);
                }
            });
        }
    }
}

const parser = new Parser();

/**
 * @param template uri template to parse
 * @return compile function to format uri
 */
export function urit(template) {
    return parser.parse(template.replace(/(\s|\n|\t|\r)*/gm, ''))
}

/**
 * @param template uri template to parse
 * @param params uri parameters to inject
 * @return formatted uri
 */
export function uri(template: string, params: object): string {
    return urit(template)(params);
}

export default urit;
