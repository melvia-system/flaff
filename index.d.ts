
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

    // uuid: string;
    // name: string;
    // size: number;
    // type: string;
    // extension: string;
    // mimeType: string
    // fileId: string | null
    // files: Item[]

    uuid: string;
    flaffUuid: string;
    fileId: string | null;
    name: string;
    size: number;
    type: string;
    extension: string;
    mimeType: string;
    createdAt: Date;
    updatedAt: Date;
    files: Item[];
  }
  interface Flaff {
    files: Item[]
    isOwner: boolean
    uuid: string;
    title: string;
    ownerLink: string;
    ownerPassword: string | null;
    guestLink: string;
    guestPassword: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
}

// declare module 'monaco-editor-vue3';