// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview Provide mock feature group data
 *
 * @version 1.108.12
 * @private
 */
sap.ui.define([
    "sap/ushell/resources"
], function (resources) {
    "use strict";

    var oFeaturedGroupConfig = {},
        sGroupTitle = resources.i18n.getText("featuredGroup.title"),
        sRecentActivity = resources.i18n.getText("recentActivities"),
        sFrequentlyUsed = resources.i18n.getText("frequentActivities"),
        sTop = resources.i18n.getText("top", 4),
        oFeaturedGroupSite = {
            "_version": "3.0.0",
            "site": {
                "identification": {
                    "version": "3.0",
                    "id": "c9dcc1f3-dec0-4db4-91d3-639bf38d91ce",
                    "title": "Featured Group",
                    "description": "Sample site for featured group cards"
                },
                "payload": { "groupsOrder": ["FeaturedGroupCards"] }
            },
            "catalogs": {},
            "vizTypes": {
                "sap.ushell.Card": {
                    "sap.app": {
                        "id": "sap.ushell.Card",
                        "type": "card",
                        "applicationVersion": { "version": "1.0.0" }
                    },
                    "sap.ui": {
                        "deviceTypes": {
                            "desktop": true,
                            "tablet": true,
                            "phone": true
                        }
                    }
                }
            },
            "visualizations": {
                "FrequentCard": {
                    "vizType": "sap.ushell.Card",
                    "businessApp": "fin.cash.bankmaster.manage.BusinessApp",
                    "target": {
                        "appId": "fin.cash.bankmaster.manage",
                        "inboundId": "Bank-manage",
                        "parameters": {}
                    },
                    "vizConfig": {
                        "sap.flp": {
                            "columns": "4",
                            "rows": "4"
                        },
                        "sap.app": {
                            "id": "FrequentCard",
                            "type": "card"
                        },
                        "sap.ui5": {
                            "services": {
                                "CardNavigationService": { "factoryName": "sap.ushell.ui5service.CardNavigation" },
                                "CardUserFrequentsService": { "factoryName": "sap.ushell.ui5service.CardUserFrequents" }
                            }
                        },
                        "sap.card": {
                            "type": "List",
                            "header": {
                                "title": sFrequentlyUsed,
                                "status": { "text": sTop },
                                "actions": [{
                                    "type": "Navigation",
                                    "service": "CardNavigationService",
                                    "parameters": { "openUI": "FrequentActivities" }
                                }]
                            },
                            "content": {
                                "maxItems": 4,
                                "data": { "service": { "name": "CardUserFrequentsService" } },
                                "item": {
                                    "title": { "value": "{Name}" },
                                    "description": { "value": "{Description}" },
                                    "highlight": "{Highlight}",
                                    "icon": {
                                        "src": "{Icon}",
                                        "label": "icon"
                                    },
                                    "actions": [{
                                        "type": "Navigation",
                                        "service": "CardNavigationService",
                                        "parameters": {
                                            "title": "{Name}",
                                            "url": "{Url}",
                                            "intentSemanticObject": "{Intent/SemanticObject}",
                                            "intentAction": "{Intent/Action}",
                                            "intentAppRoute": "{Intent/AppSpecificRoute}",
                                            "intentParameters": "{Intent/Parameters}"
                                        }
                                    }]
                                }
                            }
                        }
                    }
                },
                "RecentCard": {
                    "vizType": "sap.ushell.Card",
                    "businessApp": "fin.cash.bankmaster.manage.BusinessApp",
                    "target": {
                        "appId": "fin.cash.bankmaster.manage",
                        "inboundId": "Bank-manage",
                        "parameters": {}
                    },
                    "vizConfig": {
                        "sap.flp": {
                            "columns": "4",
                            "rows": "4"
                        },
                        "sap.app": {
                            "id": "RecentCard",
                            "type": "card"
                        },
                        "sap.ui5": {
                            "services": {
                                "CardNavigationService": { "factoryName": "sap.ushell.ui5service.CardNavigation" },
                                "CardUserRecentsService": { "factoryName": "sap.ushell.ui5service.CardUserRecents" }
                            }
                        },
                        "sap.card": {
                            "type": "List",
                            "header": {
                                "title": sRecentActivity,
                                "status": { "text": sTop },
                                "actions": [{
                                    "type": "Navigation",
                                    "service": "CardNavigationService",
                                    "parameters": { "openUI": "RecentActivities" }
                                }]
                            },
                            "content": {
                                "maxItems": 4,
                                "data": { "service": { "name": "CardUserRecentsService" } },
                                "item": {
                                    "title": {
                                        "label": "{{title_label}}",
                                        "value": "{Name}"
                                    },
                                    "description": {
                                        "label": "{{description_label}}",
                                        "value": "{Description}"
                                    },
                                    "icon": {
                                        "src": "{Icon}",
                                        "label": "icon"
                                    },
                                    "highlight": "{Highlight}",
                                    "actions": [{
                                        "type": "Navigation",
                                        "service": "CardNavigationService",
                                        "parameters": {
                                            "title": "{Name}",
                                            "url": "{Url}",
                                            "intentSemanticObject": "{Intent/SemanticObject}",
                                            "intentAction": "{Intent/Action}",
                                            "intentAppRoute": "{Intent/AppSpecificRoute}",
                                            "intentParameters": "{Intent/Parameters}"
                                        }
                                    }]
                                }
                            }
                        }
                    }
                }
            },
            "applications": {},
            "groups": {
                "FeaturedGroupCards": {
                    "identification": {
                        "id": "FeaturedGroupCards",
                        "title": sGroupTitle
                    },
                    "contentProvider": "featured",
                    "isFeatured": true,
                    "payload": {
                        "locked": true,
                        "tiles": [{
                            "id": "frequentCard",
                            "vizId": "FrequentCard",
                            "contentProvider": "featured"
                        }, {
                            "id": "recentCard",
                            "vizId": "RecentCard",
                            "contentProvider": "featured"
                        }],
                        "links": [],
                        "groups": []
                    }
                }
            },
            "systemAliases": {}
        };

    oFeaturedGroupConfig.getMockAdapterConfig = function (bEnableFrequentCard, bEnableRecentCard) {
        var aTiles = oFeaturedGroupSite.groups.FeaturedGroupCards.payload.tiles,
            oVisualizations = oFeaturedGroupSite.visualizations;

        for (var i = 0; i < aTiles.length; i++) {
            var oTile = aTiles[i],
                bSwitchOffFrequentCard = !bEnableFrequentCard && oTile.vizId === "FrequentCard",
                bSwitchOffRecentCard = !bEnableRecentCard && oTile.vizId === "RecentCard";

            if (bSwitchOffFrequentCard || bSwitchOffRecentCard) {
                delete oVisualizations[oTile.vizId];
                aTiles.splice(i, 1);
                i--;
            }
        }

        return oFeaturedGroupSite;
    };

    return oFeaturedGroupConfig;
}, /* bExport = */ true);
