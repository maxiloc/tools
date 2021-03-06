import algoliasearch from 'algoliasearch';
import {createNullCache} from '@algolia/cache-common';
import {createConsoleLogger} from '@algolia/logger-console';
import {addMethods} from '@algolia/client-common';
import getSignature from "./signature";
import customIndexMethods from "./customIndexMethods";

const isLocalAppId = function (appId) {
    return appId === 'MySuperApp' || appId.endsWith('.local') || appId.endsWith('.test');
};

const clientCache = {};
const indexCache = {};

function getHosts(appId, apikey, server) {
    if (isLocalAppId(appId)) {
        return [{url: 'localhost-1.algolia.io:8080', accept: 3}];
    }

    if (server === undefined || server === 'dsn' || server === '-dsn') { // bc
        return [
            {url: appId + '-1.algolianet.com', accept: 3},
            {url: appId + '-2.algolianet.com', accept: 3},
            {url: appId + '-3.algolianet.com', accept: 3},
        ];
    }

    let host = null;

    switch (server) {
        case '-1':  host = {url: `${appId}-1.algolianet.com`, accept: 3}; break;
        case '-2':  host = {url: `${appId}-2.algolianet.com`, accept: 3}; break;
        case '-3':  host = {url: `${appId}-3.algolianet.com`, accept: 3}; break;
        default:    host = {url: `${server}-1.algolia.net`, accept: 3};
    }

    return [host, host, host];

}

export async function getClient(appId, apiKey, server, userId, noSignature) {
    const cacheKey = `${appId}-${apiKey}-${server}-${userId}-${noSignature}`;
    if (clientCache[cacheKey]) return clientCache[cacheKey];

    let headers = {};

    if (!isLocalAppId(appId) && apiKey && noSignature !== true) {
        const signature = await getSignature(appId);
        if (signature) {
            headers['X-Algolia-Signature'] = signature;
        }
    }

    const logger = createConsoleLogger(1);
    const cache = createNullCache();
    const baseClient = algoliasearch(appId, apiKey || ' ', {
        requestsCache: cache,
        responsesCache: cache,
        hostsCache: cache, // no retry strategy at all.
        logger: logger,
        hosts: getHosts(appId, apiKey, server),
        headers: headers,
    });

    const client = addMethods(baseClient, {
        customInitIndex: function (base) {
            return function (indexName) {
                const mcmMethodsNames = ['saveObjects', 'deleteObject', 'getObject', 'getObjects', 'waitTask', 'setSettings'];
                const index = base.initIndex(indexName);

                mcmMethodsNames.forEach((methodName) => {
                    const mcmMethod = index[methodName];
                    index[methodName] = function (param, requestOptions) {
                        const options = requestOptions || {};
                        const headers = options.headers || {};
                        if (this.userId() !== undefined) headers['X-Algolia-User-ID'] = this.userId();
                        if (methodName !== 'setSettings') options.headers = headers;
                        const promise = mcmMethod(param, options);
                        const waitMethod = promise.wait;
                        promise.wait = () => waitMethod({headers});

                        return promise;
                    }
                });

                return {
                    ...index,
                    ...customIndexMethods,
                    userId: function () {
                        return userId || undefined;
                    }
                }
            };
        }
    });

    clientCache[cacheKey] = client;
    return client;
}

// todo no need to cache this, only the client matters
export async function getSearchIndex(appId, apiKey, indexName, server, userId, noSignature) {
    const cacheKey = `${appId}-${apiKey}-${indexName}-${server}-${userId}-${noSignature}`;
    if (indexCache[cacheKey]) return indexCache[cacheKey];
    const client = await getClient(appId, apiKey, server, userId, noSignature);
    const index = client.customInitIndex(indexName);

    indexCache[cacheKey] = index;

    return indexCache[cacheKey];
}

export function algoliaParams(params) {
    const algParams = {};

    Object.keys(params).forEach(function (key) {
        if (params[key].enabled) {
            algParams[key] = params[key].value;
        }
    });

    return JSON.parse(JSON.stringify(algParams));
}
