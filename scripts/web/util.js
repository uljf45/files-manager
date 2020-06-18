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

util.debounce = function (func, wait, immediate) {
    var timeout
    return function () {
        var context = this, args = arguments
        var later = function () {
            timeout = null
            if (!immediate) func.apply(context, args)
        }
        var callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func.apply(context,args)
    }
}

util.createElement = function (html) {
    let div = document.createElement('div')
    div.innerHTML = html
    return div.children[0]
}

util.createElements = function (html) {
    let div = document.createElement('div')
    div.innerHTML = html
    return Array.prototype.slice.call(div.children)
}


util.toThousands =  function (num) {
    return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}

util.typeof = function(entity) {
    let matchStr = Object.prototype.toString.call(entity).match(/^\[object (\w*)\]$/)
    return matchStr && matchStr[1]
}

util.bytesFormat = function(bytes, unit) {
    bytes = Number(bytes)
    let units = ["B", "KB", "MB", "GB", "TB"]
    if (unit == null) {
        let n = 0 
        while(bytes >= 1024) {
            n++
            bytes = bytes / 1024
        }
        return `${bytes.toFixed(2)} ${units[n]}`
    }
    let idx = units.indexOf(unit)
    if (idx == null) return
    for (let i = 1; i <= idx; i++) bytes = (bytes / 1024)
    return `${bytes.toFixed((idx-1) * 3 + 3)} ${unit}`
    
}

module.exports = util