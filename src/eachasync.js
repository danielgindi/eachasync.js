'use strict';

/**
 * Iterates over item array asynchronously
 * 
 * @param {Array} items - The items to loop over
 * @param {function(item: *. index: Number):Promise.<void>} cb - The async callback to handle each item
 * @param {Number} [concurrent=1] - How many promises to hold live at a time?
 * @return {Promise}
 */
function eachAsync(items, cb, concurrent) {

    return new Promise(function (resolve, reject) {

        concurrent = eachAsync.max || 1;
        let i = 0, len = items.length;
        let running = 0;
        let stop = i >= len, done = false, thrownException = undefined;

        function release() {

            if (done) {
                // Should never happen
                console.warn("Something weird happened: `eachAsync` reached a point that it shouldn't have reached. Please review your async code.");
                return;
            }

            if (running === 0 && stop) {
                done = true;
                return thrownException ? reject(thrownException) : resolve();
            }

            while (running < concurrent && !stop) {
                let promise = cb(items[i], i);
                i++;
                running++;

                if (i >= len) {
                    stop = true;
                }

                promise
                    .then(function () {
                        running--;
                        release();
                    })
                    .catch(function (ex) {
                        running--;
                        thrownException = ex;
                        stop = true;
                        release();
                    });
            }
        }

        release();

    });
}

/**
 * The default value for max concurrent promises
 * @type {number}
 */
eachAsync.max = 1;

module.exports = eachAsync;
