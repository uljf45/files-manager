const util = {

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