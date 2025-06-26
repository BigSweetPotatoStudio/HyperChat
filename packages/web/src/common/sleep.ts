/**
 * Asynchronously pauses execution for a specified duration.
 * @param {number} t - The time in milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 */
export async function sleep(t: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, t));
}