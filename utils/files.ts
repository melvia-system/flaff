export const getParentFolder = (items: Item[], fileId: string) => {
  // search folder in parent
  // all items structure is { id: 1, files: [ {id:2, files: [ {id:3, files: []} ] } ] }
  // items is nested array files, so we need to search recursively
  const searchParentByFileId = (fileId: string) => {
    let _tmp: Item|undefined
    const search = (items: Item[]) => {
      for (const item of items) {
        if (item.uuid === fileId) {
          _tmp = item
          break
        }
        if (item.files) {
          search(item.files)
        }
      }
    }
    search(items)
    return _tmp
  }

  // search nested file id chain, until we found type folder
  let parent: Item|undefined = searchParentByFileId(fileId)
  while (parent && parent.type !== 'folder') {
    if (parent.fileId) {
      parent = searchParentByFileId(parent.fileId)
    } else {
      parent = undefined
    }
  }

  return parent
}

const ICONS_ITEMS_LIST: {
  [key: string]: {
    [key: string]: string
  }
} = {
  folder: {
    default: 'i-ph-folder',
  },
  file: {
    default: 'i-ph-file',
    pdf: 'i-ph-file-pdf',
    txt: 'i-ph-file-txt',
    md: 'i-ph-markdown-logo',
    jpg: 'i-ph-file-jpg',
    jpeg: 'i-ph-file-jpg',
    png: 'i-ph-file-png',
  }
}
export const getIconsItemsList = () => ICONS_ITEMS_LIST
export const getIcon = (item: Item) => {
  const ext = item.extension
  const type = item.type
  return ICONS_ITEMS_LIST[type][ext] || ICONS_ITEMS_LIST[type].default
}