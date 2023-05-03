/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/viz/library", //Workaround until sap.viz has fixed a dependency issue
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/format/DateFormat"
], function(
    vizLibrary,
    ChartFormatter,
    VizFormat,
    NumberFormat,
    DateFormat
) {
    "use strict";

    var iNumberOfDigits = 10;           // Number of fractional digits to generate formatters, excluding -1 and default
    var aBaseFormatters = [
        { prefix: "CURR",           fn: formatCurrency   },
        { prefix: "axisFormatter",  fn: formatAxis       },
        { prefix: "0.0%",           fn: formatPercentage }
    ];
    var aDateFormatterNames = ["YearMonthDay", "YearMonth", "MMM", "YearQuarter", "Quarter", "YearWeek", "Week"];

    function formatCurrency(minFractionDigits, value) {
        var currencyFormat;

        if (minFractionDigits === -1) {
            currencyFormat = NumberFormat.getCurrencyInstance({
                style: "short",
                currencyCode: false
            });
        } else {
            currencyFormat = NumberFormat.getCurrencyInstance({
                style: "short",
                currencyCode: false,
                minFractionDigits: minFractionDigits,
                maxFractionDigits: minFractionDigits
            });
        }
        return currencyFormat.format(Number(value));
    }

    function formatAxis(minFractionDigits, value) {
        var numberFormat;

        if (minFractionDigits === -1) {
            numberFormat = NumberFormat.getFloatInstance({ style: "short" });
        } else {
            numberFormat = NumberFormat.getFloatInstance({
                style: "short",
                minFractionDigits: minFractionDigits,
                maxFractionDigits: minFractionDigits ? minFractionDigits : 1
            });
        }

        return numberFormat.format(Number(value));
    }

    function formatPercentage(minFractionDigits, value) {
        var percentFormat;

        if (minFractionDigits === -1) {
            percentFormat = NumberFormat.getPercentInstance({
                style: "short",
                minFractionDigits: 1,
                maxFractionDigits: 1
            });
        } else {
            percentFormat = NumberFormat.getPercentInstance({
                style: "short",
                minFractionDigits: minFractionDigits,
                maxFractionDigits: minFractionDigits
            });
        }
        return percentFormat.format(Number(value));
    }

    function formatDate(pattern, value) {
        if (value.constructor === Date) {
            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: pattern
            });

            if (pattern === "YearMonthDay") {
                oDateFormat = DateFormat.getDateInstance({ style: "medium" });
            }
            if (pattern === "YearMonth" || pattern === "MMM") {
                oDateFormat = DateFormat.getDateTimeInstance({ format: "MMM" });
            }
            if (pattern === "YearQuarter" || pattern === "Quarter") {
                oDateFormat = DateFormat.getDateTimeInstance({ format: "QQQ" });
            }
            if (pattern === "YearWeek" || pattern === "Week") {
                oDateFormat = DateFormat.getDateTimeInstance({ format: "www" });
            }
            value = oDateFormat.format(new Date(value), true);
        }
        return value;
    }

    return {
        registerCustomFormatters: function () {
            var chartFormatter = ChartFormatter.getInstance();
            var aAllFormatters = [];

            aBaseFormatters.forEach(function (oBaseFormatter) {
                aAllFormatters.push({
                    name: oBaseFormatter.prefix,
                    fn: oBaseFormatter.fn.bind(null, 2) // Set default number of fractional digits to 2
                });

                for (var i = -1; i <= iNumberOfDigits; i++) {
                    var sSuffix = "/" + i + "/";
                    aAllFormatters.push({
                        name: oBaseFormatter.prefix + sSuffix,
                        fn: oBaseFormatter.fn.bind(null, i)
                    });
                }
            });

            aDateFormatterNames.forEach(function (sDateFormatterName) {
                aAllFormatters.push({
                    name: sDateFormatterName,
                    fn: formatDate.bind(null, sDateFormatterName)
                });
            });

            aAllFormatters.forEach(function(formatter) {
                chartFormatter.registerCustomFormatter(formatter.name, formatter.fn);
            });

            VizFormat.numericFormatter(chartFormatter);
        }
    };
});