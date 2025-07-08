const { pathToRegexp } = require('path-to-regexp');

function validateRoute(path) {
    try {
        const keys = [];
        const re = pathToRegexp(path, keys);
        console.log(`✅ Valid route: ${path}`);
    } catch (err) {
        console.error(`❌ Invalid route: ${path} → ${err.message}`);
    }
}

// Test some known paths
validateRoute('/:'); // ❌ Should fail
validateRoute('/:id'); // ✅ Should pass
validateRoute('/*'); // ❌ Should fail
validateRoute('/*path'); // ✅ Should pass
validateRoute('/user{/:id}'); // ❌ Should fail
validateRoute('/user/:id?'); // ✅ Optional param