// 数组响应式
// 1.替换数组原型中 7 个方法
const originalProto = Array.prototype

// 备份一份，修改备份
const arrayProto = Object.create(originalProto);
['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'].forEach(method => {
    arrayProto[method] = () => {
        // 原始操作
        originalProto[method].apply(this, arguments)

        // 覆盖
        console.log('数组执行', method, '操作')
    }
})


// 属性拦截： defineProperty()
// Vue.util.
function defineReactive(obj, key, val) {

    // 递归判断
    observe(val)

    // 属性拦截
    // 利用了闭包！！！
    // 1. 局部作用域
    // 2. 通过函数暴露出去
    // 函数每被调用一次，都能保留中间值在内存里
    Object.defineProperty(obj, key, {
        get() {
            console.log('get', key)
            return val
        },
        set(newVal) {
            console.log('set', key)
            if (newVal !== val) {
                // 新设置的值有可能是对象
                observe(newVal)
                val = newVal
            }
            // 很多人会疑问，val 明明是形参，为什么给他赋值就能够达到数值改变的效果呢？形参不是出了这个函数就没用了么？
            // 其实，这就用到了闭包的原理，val 是外层函数 defineReactive 的参数，而我们实际上使用 val 却是在内层的 get 或 set 方法里面
            // 这样就形成了一个闭包的结构了。根据闭包的特性，内层函数可以引用外层函数的变量，并且当内层保持引用关系时外层函数的这个变量
            // 不会被垃圾回收机制回收。那么,我们在设置值的时候，把 newVal 保存在 val 变量当中，然后 get 的时候再通过 val 去获取，这样，我们再访问
            // obj.name 时，无论是设置值还是获取值，实际上都是对 val 这个形参进行操作的。
        }
    })

}

// 遍历需要响应式处理的对象
function observe(obj) {
    if (typeof obj !== 'object') {
        return obj
    }

    if (Array.isArray(obj)) {
        // 覆盖原型，替换7个变更操作
        obj.__proto__ = arrayProto
        // 对数组内部元素进行响应化
        const keys = Object.keys(obj)
        keys.forEach(key => observe(obj[key]))
    } else {
        Object.keys(obj).forEach(key =>
            defineReactive(obj, key, obj[key])
        )
    }
}

// 如果用户有动态属性需要添加，需要使用 set
function set(obj, key, val) {
    defineReactive(obj, key, val)
}

const obj = {
    foo: 'foo',
    bar: 'bar',
    a: {
        n: 1
    },
    arr: []
}
// defineReactive(obj, 'foo', 'fooo')
// defineReactive(obj, 'bar', 'barr')
observe(obj)

// obj.foo
// obj.foo = 'foooooooooo'
// obj.a.n = 10
// obj.a = {n: 10}
// console.log('==============')
// obj.a.n

// obj.bla = 'blabla'

// set(obj, 'bla', 'blabla')
// obj.bla

// Array
// arr[0] = 'aaa'
// arr[2]
// 数组拦截需要覆盖 7 个变更方法：
// push/pop/shift/unshift/...

obj.arr.push(4)
