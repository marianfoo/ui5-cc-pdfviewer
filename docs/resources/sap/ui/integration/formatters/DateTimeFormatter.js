/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/format/DateFormat","sap/ui/core/date/UniversalDate","sap/ui/integration/util/Utils"],function(t,e,a){"use strict";var r={dateTime:function(r,i,n){var s=a.processFormatArguments(i,n),o=t.getDateTimeInstance(s.formatOptions,s.locale),u=a.parseJsonDateTime(r);var m=new e(u);var c=o.format(m);return c},date:function(t,e,a){return r.dateTime.apply(this,arguments)}};return r});
//# sourceMappingURL=DateTimeFormatter.js.map