// Vue 3 中响应式实现基于 Proxy
function reactive(obj) {

    if (typeof obj !== 'object') {
        return obj
    }

    return new Proxy(obj, {
        get(target, key) {
            // console.log('get', key)
            const res = Reflect.get(target, key)
            // 依赖收集
            track(target, key)
            return (typeof res !== 'object') ? res : reactive(obj)
        },

        set(target, key, val) {
            // console.log('set', key)
            // 触发更新
            trigger(target, key)
            return Reflect.set(target, key, val)
        },

        deleteProperty(target, key) {
            // console.log('delete', key)
            return Reflect.deleteProperty(target, key)
        }
    })
}

// 临时保存要添加依赖的副作用函数
const effectStack = []

// 副作用函数
function effect(fn) {
    // 执行 fn，处理可能的错误，入栈出栈行为
    const e = createReactiveEffect(fn)
    // 执行封装之后的副作用函数
    e()
    return e
}

function createReactiveEffect(fn) {
    const effect = function () {
        try {
            // 1.入栈
            effectStack.push(effect)
            // 2.执行，会触发 getter 函数
            return fn(...arguments)
        } finally {
            // 3.出栈
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
    // 1.拿出副作用函数
    const effect = effectStack[effectStack.length - 1]
    if (effect) {
        let depMap = targetMap.get(target)
        // 首次来的时候不存在，需要创建
        if (!depMap) {
            depMap = new Map()
            targetMap.set(target, depMap)
        }

        // 获取 key 对应的副作用函数 Set
        let deps = depMap.get(key)
        if (!deps) {
            deps = new Set()
            depMap.set(key, deps)
        }

        // 将前面放入 effectStack 中的副作用函数添加到 deps
        deps.add(effect)
    }
}

// 根据传入的 target，key 获取它们对应的副作用函数 Set，调用它们
function trigger(target, key) {
    const depMap = targetMap.get(target)
    if (!depMap) {
        return
    }

    // 获取 deps
    const deps = depMap.get(key)
    if (deps) {
        deps.forEach(dep => dep())
    }
}

// obj.foo
// obj.foo = 'fooooo'
// obj.bar = 'bar'
// delete obj.bar
// obj.a.b = 10

// const obj = reactive({
//     foo: 'foo',
//     a: {
//         b: 1
//     }
// })
//
// effect(() => {
//     console.log('foo changed 11', obj.foo)
// })
//
// effect(() => {
//     console.log('foo changed 22', obj.foo)
// })
//
// effect(() => {
//     console.log('b changed 33', obj.a.b)
// })
//
// obj.a.b = 10

export {effect, reactive, track, trigger}
