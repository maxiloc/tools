<template>
    <internal-app>
        <div class="min-h-screen">
            <app-header />
            <div class="max-w-960 mx-auto mt-24" v-for="group in appsGroups">
                <h2 class="text-solstice-blue-opacity-80">{{group.name}}</h2>
                <p class="text-solstice-blue-opacity-80">{{group.description}}</p>
                <div class="flex flex-wrap">
                    <a v-for="app in group.apps" :href="app.url" class="my-24 mr-24">
                        <div
                            class="rounded border border-proton-grey-opacity-60 bg-white p-24 w-200 text-center text-lg shadow text-nova-grey"
                        >
                            {{app.name}}
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </internal-app>
</template>

<script>
    import InternalApp from "common/components/app/InternalApp";
    import AppHeader from "common/components/header/AppHeader";
    import AppManagement from "common/components/configuration/AppManagement";

    const appsGroups = [
        {
            name: 'Relevance tools',
            description: 'Bootstrap, iterate, and fine tune relevance',
            apps: [
                {name: 'Metaparams', url: '/metaparams'},
                {name: 'Relevance Testing', url: '/relevance-testing'},
                {name: 'Index Differ', url: '/index-differ'},
            ],
        },
        {
            name: 'Debugging tools',
            description: 'Debug implementation',
            apps: [
                {name: 'Analyse Logs', url: 'https://logger.algolia.com/'},
            ]
        },
        {
            name: 'Data tools',
            description: 'Play with data',
            apps: [
                {name: 'Transform', url: '/transform'},
                {name: 'Index analyzer', url: '/index-analyzer'},
            ]
        },
        {
            name: 'Feature Testing tools',
            description: 'Test features without code',
            apps: [
                {name: 'Insights UI', url: '/insights-ui'},
            ]
        },
    ];

    export default {
        name: 'Home',
        components: {InternalApp, AppHeader, AppManagement},
        data: function () {
            return {
                appsGroups: appsGroups,
            };
        }
    }
</script>
