// Implement the promise function

function Promise (execute) {

    var self = this

    self.callbacks = []
    self.status = 'pending'
    self.value = null
    self.reason = null

    function resolve (value) {
        setTimeout(function () {
            if (self.status === 'pending') {
                self.value = value
                self.status = 'resolved'
                if (value instanceof Promise) {
                    return value.then(resolve, reject)
                }
                for (var i = 0; i < self.callbacks.length; i++) {
                    self.callbacks[i].onResolved(value)
                }
            }
        })
    }

    function reject (reason) {
        setTimeout(function () {
            if (self.status === 'pending') {
                self.status = 'rejected'
                self.reason = reason
                if (reason instanceof Promise) {
                    return reason.catch(reject)
                }
                for (var i = 0; i < self.callbacks.length; i++) {
                    self.callbacks[i].onRejected(reason)
                }
            }
        })
    }

    try {
        execute(resolve, reject)
    } catch (error) {
        reject(error)
    }
}

Promise.prototype.then = function (onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : function (value) {return value}
    onRejected = typeof onRejected === 'function' ? onRejected : function (reason) {return reason}

    var promise = null
    var self = this
    if (this.status === 'resolved') {
        return promise = new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    var x = onResolved(self.value)
                    resolvePromise(promise, x, resolve, reject)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    if (this.status === 'rejected') {
        return promise = new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    var y = onRejected(self.reason)
                    resolvePromise(promise, y, resolve, reject)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    if (this.status === 'pending') {
        return promise = new Promise(function (resolve, reject) {
            self.callbacks.push({
                onResolved: function (value) {
                    try {
                        var x = onResolved(value)
                        resolvePromise(promise, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                },
                onRejected: function (reason) {
                    try {
                        var y = onRejected(reason)
                        resolvePromise(promise, y, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                }
            })
        })
    }
}

function resolvePromise (promise, x, resolve, reject) {
    if (promise === x) {
        return reject('error')
    }
    if (x instanceof Promise) {
        if (x.status === 'pending') {
            x.then(function (v) {
                resolvePromise(promise, v, resolve, reject)
            },reject)
        } else {
            x.then(resolve, reject)
        }
        return
    }
    if ((x !== null) && ((typeof x === 'function') || (typeof x === 'object'))) {
        var callbackFlag = false
        try {
            var then = x.then
            if (typeof then === 'function') {
                then.call(x, function (value) {
                    if (callbackFlag) return
                    resolvePromise(promise, value, reject, resolve)
                }, function (reason) {
                    if (callbackFlag) return
                    reject(reason)
                })
            } else {
                if (callbackFlag) return
                resolve(x)
            }
        } catch (error) {
            if (callbackFlag) return
            reject(error)
        }
    } else {
        resolve(x)
    }
}

Promise.deferred = Promise.defer = function () {
    var dfd = {}
    dfd.promise = new Promise(function(resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
}

module.exports = Promise
