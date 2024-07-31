
export {
  Item  
}

declare global {
  interface Item {
    // uuid: string
    // type: string
    // name: string
    // mime: string
    // ext: string
    // size: number
    uuid: string;
    name: string;
    size: number;
    type: string;
    extension: string;
    mimeType: string
  }
  interface Flaff {
    files: Item[]
    isOwner: boolean
    uuid: string
  }
}

// declare module 'monaco-editor-vue3';