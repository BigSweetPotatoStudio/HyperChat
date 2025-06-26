/**
 * A decorator that mocks the return value of an asynchronous method in development mode.
 * If the original method throws an error, it catches the error and returns the provided mock response.
 * In production mode, the original error is re-thrown.
 *
 * @param {any} res - The mock response to return if the original method fails in development mode.
 * @returns {MethodDecorator} A method decorator function.
 */
export function mock(res: any) {
    /**
     * The decorator function applied to a method.
     * @param {any} target - The prototype of the class (for instance methods) or the constructor function (for static methods).
     * @param {string} propertyKey - The name of the method being decorated.
     * @param {PropertyDescriptor} descriptor - The property descriptor for the method.
     */
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Store the original method implementation.
        const oldValue = descriptor.value;

        // Replace the original method with a new one that includes mocking logic.
        descriptor.value = async function (...args: any[]) {
            try {
                // Attempt to call the original method.
                return await oldValue.apply(this, args);
            } catch (e: any) {
                // If an error occurs, check the environment.
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Mocking ${String(propertyKey)}:`, res);
                    return res; // Return the mock response in development.
                } else {
                    throw e; // Re-throw the original error in production.
                }
            }
        };
    };
}

