export function mock(res: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let oldValue = descriptor.value
        descriptor.value = async function (...args) {
            let t = await oldValue.apply(this, args).catch(e => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`mock ${propertyKey}: `, res)
                    return res
                } else {
                    throw e
                }
            })
            return t
        }
    }
}

