
interface ParserRegistrationOptions {
    object?: Object;
    extensionOf?: string;
}

export function register(tagName: string, options: ParserRegistrationOptions): Function {
    return new Function();
}

export function deregister(tagName: string): void {

}
