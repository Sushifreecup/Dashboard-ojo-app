/// <reference types="vite/client" />

declare module 'jmuxer' {
    export default class JMuxer {
        constructor(options: any);
        feed(data: any): void;
        destroy(): void;
    }
}
