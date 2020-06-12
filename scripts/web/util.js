const util = {

}
util.stringCompare = function (a, b) {
    let len = Math.min(a.length, b.length)
    for (let i = 0; i < len; i++) {
        let res = a.codePointAt(i) - b.codePointAt(i)
        if (res !== 0) return res
    }
    if (a.length > b.length) {
        return 1
    }
    if (a.length < b.length) {
        return -1
    }

    return 0
}

util.parent = function (node, selector) {
    if (!node) return
    let parent = node.parentElement
    let prefix = selector && selector[0]
    let selNoPref = selector.slice(1)
    while(parent) {
        switch (prefix) {
            case '.':
                if (parent.classList.contains(selNoPref)) {
                    return parent
                }
                break
            case '#':
                if (parent.id == selNoPref) {
                    return parent
                }
                break
            default: //tag
                if (parent.tagName == selector) {
                    return parent
                }
                break
        }
        parent = parent.parentElement
    }
}

module.exports = util