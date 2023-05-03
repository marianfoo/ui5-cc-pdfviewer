/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/util/changeVisualization/commands/RenameVisualization","sap/ui/rta/util/changeVisualization/commands/MoveVisualization","sap/ui/rta/util/changeVisualization/commands/CombineVisualization","sap/ui/rta/util/changeVisualization/commands/SplitVisualization","sap/ui/rta/util/changeVisualization/commands/CreateContainerVisualization"],function(a,i,n,t,e){"use strict";var s={rename:a,move:i,combine:n,split:t,createContainer:e};return function(a){var i=a.commandName;if(i==="settings"){i=a.changeCategory}return s[i]}});
//# sourceMappingURL=getCommandVisualization.js.map