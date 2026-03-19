(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/_0-m5tdn._.js",
"[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
globalThis["__SENTRY_SERVER_MODULES__"] = {
    "@auth/prisma-adapter": "^2.11.1",
    "@hookform/resolvers": "^5.2.2",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/adapter-pg": "^7.1.0",
    "@prisma/client": "^7.3.0",
    "@sentry/nextjs": "^10.44.0",
    "bcryptjs": "^3.0.3",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "lucide-react": "^0.555.0",
    "next": "^16.2.0",
    "next-auth": "^4.24.13",
    "pg": "^8.16.3",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-hook-form": "^7.68.0",
    "swr": "^2.3.7",
    "zod": "^4.1.13",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.30",
    "@types/pg": "^8.15.6",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-plugin-react-compiler": "1.0.0",
    "baseline-browser-mapping": "^2.10.8",
    "eslint": "^9",
    "eslint-config-next": "16.0.7",
    "prisma": "^7.3.0",
    "tailwindcss": "^4",
    "ts-node": "^10.9.2",
    "tsx": "^4.20.6",
    "typescript": "^5"
};
globalThis["_sentryNextJsVersion"] = "16.2.0";
globalThis["_sentryRewritesTunnelPath"] = "/monitoring";
async function register() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
"[project]/node_modules/next/dist/esm/build/templates/edge-wrapper.js { MODULE => \"[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)\" } [instrumentation-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {

// The wrapped module could be an async module, we handle that with the proxy
// here. The comma expression makes sure we don't call the function with the
// module as the "this" arg.
// Turn exports into functions that are also a thenable. This way you can await the whole object
// or  exports (e.g. for Components) or call them directly as though they are async functions
// (e.g. edge functions/middleware, this is what the Edge Runtime does).
// Catch promise to prevent UnhandledPromiseRejectionWarning, this will be propagated through
// the awaited export(s) anyway.
self._ENTRIES ||= {};
const modProm = Promise.resolve().then(()=>__turbopack_context__.i("[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)"));
modProm.catch(()=>{});
self._ENTRIES["middleware_instrumentation"] = new Proxy(modProm, {
    get (innerModProm, name) {
        if (name === 'then') {
            return (res, rej)=>innerModProm.then(res, rej);
        }
        let result = (...args)=>innerModProm.then((mod)=>(0, mod[name])(...args));
        result.then = (res, rej)=>innerModProm.then((mod)=>mod[name]).then(res, rej);
        return result;
    }
});
}),
]);

//# sourceMappingURL=_0-m5tdn._.js.map