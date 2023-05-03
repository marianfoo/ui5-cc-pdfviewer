/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([], function () {
    "use strict";

    return {
        DATE_OPTIONS: {
            SINGLE_OPTIONS: [
                "DATE",
                "YESTERDAY",
                "TOMORROW",
                "TODAY",
                "FIRSTDAYWEEK",
                "LASTDAYWEEK",
                "FIRSTDAYMONTH",
                "LASTDAYMONTH",
                "FIRSTDAYQUARTER",
                "LASTDAYQUARTER",
                "FIRSTDAYYEAR",
                "LASTDAYYEAR"
            ],
            RANGE_OPTIONS: [
                "THISWEEK",
                "LASTWEEK",
                "NEXTWEEK",
                "THISMONTH",
                "LASTMONTH",
                "NEXTMONTH",
                "THISQUARTER",
                "LASTQUARTER",
                "NEXTQUARTER",
                "QUARTER1",
                "QUARTER2",
                "QUARTER3",
                "QUARTER4",
                "THISYEAR",
                "LASTYEAR",
                "NEXTYEAR",
                "YEARTODATE",
                "DATETOYEAR",
                "DATERANGE",
                "DATETIMERANGE",
                "FROM",
                "FROMDATETIME",
                "LASTDAYS",
                "LASTMONTHS",
                "LASTQUARTERS",
                "LASTWEEKS",
                "LASTYEARS",
                "NEXTDAYS",
                "NEXTMONTHS",
                "NEXTQUARTERS",
                "NEXTWEEKS",
                "NEXTYEARS",
                "SPECIFICMONTH",
                "TO",
                "TODATETIME",
                "TODAYFROMTO"
            ],
            EXCLUDE_LIST: [
                "DATE",
                "FROM",
                "SPECIFICMONTH",
                "TO",
                "DATERANGE"
            ],
            SPECIAL_RANGE: [
                "LASTDAYS",
                "LASTMONTHS",
                "LASTQUARTERS",
                "LASTWEEKS",
                "LASTYEARS",
                "NEXTDAYS",
                "NEXTMONTHS",
                "NEXTQUARTERS",
                "NEXTWEEKS",
                "NEXTYEARS",
                "TODAYFROMTO"
            ]
        }
    };
});