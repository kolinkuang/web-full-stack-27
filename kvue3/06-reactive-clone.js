// Vue 3 中基于 Proxy 的响应式实现
function reactive(obj) {

    if (typeof obj !== 'object') {
        return obj
    }

    return new Proxy(obj, {
        get(target, key) {
            const res = Reflect.get(target, key)
            track(target, key)
            return (typeof res !== 'object') ? res : reactive(obj)
        },
        set(target, key, val) {
            trigger(target, key)
            return Reflect.set(target, key, val)
        },
        deleteProperty(target, key) {
            return Reflect.deleteProperty(target, key)
        }
    })
}

// 临时保存要添加依赖的副作用函数
const effectStack = []

// 副作用函数
function effect(fn) {
    const e = createReactiveEffect(fn)
    e()
    return e
}

function createReactiveEffect(fn) {
    const effect = function () {
        try {
            effectStack.push(effect)
            return fn(...arguments)
        } finally {
            effectStack.pop()
        }
    }

    return effect
}

// 存放依赖关系的数据结构
const targetMap = new WeakMap()
// 用 WeakMap 方便进行 GC

// 依赖跟踪收集函数
function track(target, key) {
    const effect = effectStack[effectStack.length - 1]
    if (effect) {
        let depMap = targetMap.get(target)
        if (!depMap) {
            depMap = new Map()
            targetMap.set(target, depMap)
        }

        let deps = depMap.get(key)
        if (!deps) {
            deps = new Set()
            depMap.set(key, deps)
        }

        deps.add(effect)
    }
}

// 根据传入的 target，key 获取它们对应的副作用函数 Set，调用它们
function trigger(target, key) {
    const depMap = targetMap.get(target)
    if (!depMap) {
        return
    }

    const deps = depMap.get(key)
    if (deps) {
        deps.forEach(dep => dep())
    }
}

export {effect, reactive, track, trigger}
