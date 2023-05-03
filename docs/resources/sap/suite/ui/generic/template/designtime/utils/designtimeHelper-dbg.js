sap.ui.define(["sap/base/util/extend", "sap/base/util/deepExtend", "sap/base/util/merge"], function (extend, deepExtend, merge) {
	"use strict";

	/*
	 * The main task of this class is to translate the allowList (defined in internal format) into a designtime that ensures, that only the changes according to the allow list are possible (with tool
	 * support - manually, it's always possible to create arbitrary change files).
	 * 
	 * To achieve this, it's necessary to read the designtime for all affected controls and check the changes that would be allowed without our intervention. This is caused by the fact, that the UI 
	 * adaptation tooling combines designtime provided from different sources (control itself, inherited, propagated, or set in view) in a disjunktive way (any change defined in one of the sources is 
	 * allowed), which contradicts the need to only allow changes that actually can work correctly with the framework code. However, with propagation one can either disallow e.g. all actions for one 
	 * control (this doesn't help, is control provides several actions, but we can only allow some of them), or to explicitly disallow a single action. To use this latter possibility, the name of 
	 * that action needs to be known. As controls can add new actions with upcoming releases without our interaction, we read all actions from base designtimes, and disallow everything not mentioned 
	 * in our internal allow list. To ensure that the designtime we provide is not overridden again, we only provide designtime for the top level, and propagate it from there to all controls.
	 * 
	 * (If a FE app is run inside some surrounding application (like e.g. unified inbox), they still could use the same technique, ropagate different metadata and thus allow additional changes. But if
	 * that would break anything, it would also be in the responsibility of that surrounding application.)  
	 * 
	 * Reading the base designtime is only possible asynchronously, but the propagateMetadata callback needs to provide the designtime data synchronously. The designtime (of the view) itself however
	 * can be provided asynchronously (i.e. returning a promise resolving to the designtime). Thus we need to read the base designtime for all controls already when the view designtime is requested,
	 * and only resolve the promise after we got all the base designtime data.
	 *
	 */
	
	
	/*
	 * Todos / problems:
	 * - multiple propagation (a propagates metadata to b that contain a propagation method propagating to c)  
	 * - hierarchy via getParent is not identical to via getAggregation (check, whether this creates a problem)
	 * - [solved] generic getter (getAggregation) on control instance is not reliable - use generic getter on metadata instead (oControl.getMetadata().getAggregation(sAggregation).get(oControl))
	 * 	Example: ObjectPage.getAggregation("headerContent")
	 * - private/hidden Aggregation not provided in getMetadata().getAllAggregations, but used for propagation
	 * 	Example: ObjectPage.getAggregation("_anchorBar")
	 * 	Solution idea: build designTime top-down (like sap/ui/dt/DesignTime does) instead of bottm-up (current logic here) 
	 * 		Problems: 
	 * 		- How to know which descendants to propagate to?
	 * 		- ensure correct order of propagation
	 * 		- when to call getAggregation on instance directly (needed if aggregation is not defined) and when to use metadata method 
	 */
	
	var mControlInfo = {};
	var aViews = [];
	var oUrlParser = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("URLParsing");
	var oUrlParams = oUrlParser.parseParameters(document.location.search);
	/**
	 * get effective designtime for all controls on current active view
	 * @return {Promise} promise resolving to a map, with key = control id, value = designtime
	 */
	function loadBaseDesigntime(){
		var aPromises = [];
		
		function addToControlInfo(oControl){
			if (mControlInfo[oControl.getId()]){
				return;
			}
			
			var oControlInfo = {};
			mControlInfo[oControl.getId()] = oControlInfo;
			oControlInfo.designTimePromise = oControl.getMetadata().loadDesignTime(oControl);
			aPromises.push(oControlInfo.designTimePromise);
			oControlInfo.designTimePromise.then(function(oDesignTime){
				oControlInfo.designTime = oDesignTime;
			});
		}
		
		function findPreceedingKnownNode(oNode){
			// ignore empty node or id. If node is not known and has no parent, we cannot find control it belongs to (can hopefully not be relevant)
			return !oNode || !oNode.id || mControlInfo[oNode.id] ? oNode : oNode.parentNode && findPreceedingKnownNode(oNode.parentNode) ;
		}
		
		// Assumption: Enough to start with template views and find all aggregated objects
		// for later added controls: enough to add listener on those views, react if related Node is a known control, and recheck all aggregated objects of that control
		document.querySelectorAll(".sapUiXMLView").forEach(function(oTopNode){
			var oView = sap.ui.getCore().byId(oTopNode.id);
			// defensive programming, as any error here would be caught by UI adaptation and lead to just ignoring designtime provided here - which would open up for any UI adaptation provided from
			// deeper layers
			// first two conditions should actually not occur, but if so, evaluating the third would break
			if (!oView || !(oView instanceof  sap.ui.core.mvc.XMLView) || !(oView.getController() instanceof sap.suite.ui.generic.template.lib.TemplateViewController)){return;}
			
			aViews.push(oView);
			
			oView.findAggregatedObjects(true).forEach(addToControlInfo);
			
			// if anything is added later (e.g. for dynamic multi edit dialog, fields are added in js code), we need to retrieve the corresponding designtime 
			oTopNode.addEventListener('DOMNodeInserted', function(oEventInfo){
				// one control can add mutliple node hierarchy levels, so find the next (known) control above
				var oNode = findPreceedingKnownNode(oEventInfo.relatedNode);
				var oControl = oNode && sap.ui.getCore().byId(oNode.id);
				if (oControl) {
					oControl.findAggregatedObjects(true).forEach(addToControlInfo);
				}
			});
		});
				
		
		return Promise.all(aPromises);
	}

	/*
	* Returns the value of RTA mode from the URL
	*/
	function getRtaModeValue(sFioriToolsRtaMode) {
		return oUrlParams[sFioriToolsRtaMode] && oUrlParams[sFioriToolsRtaMode][0].toLowerCase();
	}

	/*
	 * Returns the branch of the control tree as an array ordered from bottom to top, if the control is relevant (i.e. direct part of a template view). I.e. the first entry of the array is the 
	 * control itself, the last one is an XMLView (with a controller of type TemplateViewController). "direct" means, no other XMLViews are in between.
	 * If control is not relevant (i.e. not part of a view, or part of a different view), returns undefined. 
	 */
	function getAncestors(oControl){
		var aAncestors = [oControl];
		
		while (!(oControl instanceof sap.ui.core.mvc.XMLView)){
			oControl = oControl.getParent();
			if (!oControl){
				// control not in view hierarchy => not relevant
				return;
			}
			aAncestors.push(oControl);
		}
		
		if (!(oControl.getController() instanceof sap.suite.ui.generic.template.lib.TemplateViewController)){
			// next view up the hierarchy not a template component (could e.g. be an extension) => no need to propagate designtime
			return;
		}
		return aAncestors;
		
	}
	
	/*
	 * check, whether oDescendant is contained in the subtree starting with oAncestor (including oAncestor)
	 */
	function isAggregated(oDescendant, oAncestor){
		// in some cases (e.g. table with no data), oAncestor is not a control (but simply a string) - in that case, it cannot be the one we are searching for
		return oAncestor === oDescendant || (oAncestor.findAggregatedObjects && oAncestor.findAggregatedObjects(true).includes(oDescendant));
	}
		
	/*
	 * Determine name of aggregation of oAncestor to which (the subtree containing) oDescendant belongs
	 */
	function getAncestorAggregationName(oAncestorInfo, oDescendant){
		/* 
		 * Metadata propagation can be done directly from any ancestor to any descendant (skipping any levels in between - like we also do directly from view down to the controls). Thus, to build the
		 * base designtime (the resulting designtime if we would not interfere), we need to analyze propagation from any layer in between. Propagation is bound to an aggregation, so we need to find the
		 * aggregation of the ancestor control to which the descendant control belongs (directly or indirectly)
		 */
		
		// some controls use aggregations not defined in their metadata (but provide designtime propagation for them). Example: ObjectPage: _anchorBar
		// aggregations not mentioned in designtime are anyway not used for propagation
		var aAllAggregations = Object.keys(mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations);
		
		return aAllAggregations.find(function(sAggregation){
			// Remark: generic getter getAggregation on control instance is not reliable - but generic getter on metadata (passing control instance) is!
			// howver, generic getter is not available, if aggregation is not declared in metadata => in that case, fall back to getAggregation on control instance
			var oAggregation = oAncestorInfo.oAncestor.getMetadata().getAggregation(sAggregation);
			var vAggregationContent = oAggregation && oAggregation.get(oAncestorInfo.oAncestor) || oAncestorInfo.oAncestor.getAggregation(sAggregation);
			if (Array.isArray(vAggregationContent)) {
				return vAggregationContent.find(isAggregated.bind(null, oDescendant));
			} else {
				return vAggregationContent && isAggregated(oDescendant, vAggregationContent);
			}
		});
	}
	
	
	function getBaseDesignTime(oControl){
		if (oControl instanceof sap.ui.core.mvc.XMLView){
			/*
			 * There's no (relevant) designtime for views:
			 * - For a view of a template component, we are defining the designtime directly, so no need to propagate to it (and actually waiting for a base designtime would cause infinite waiting)
			 * - Other views could be created for reuse components or extensions - in these cases, the owners are responsible for providing corresponding designtime (a change on any control within the 
			 * 	reuse component or extension would not directly break any of our logic, as we don't know these controls. It still could indirectly break sth. - but then reuse component or extension
			 * 	would be in charge)
			 */
			return;
		}
		
		var oControlInfo = mControlInfo[oControl.getId()];
		
		if (!oControlInfo || (oControlInfo.designTimePromise && !oControlInfo.designTime)){
			// either the control is not known at all to us (i.e. not even added to the DOM) or we are still waiting to retrieve its designtime. Assumption: This can only happen, if
			// the control is just added by UI adaptation. In this case, we don't need to interfere - thus we should just return an empty designtime. This can be achieved by 
			// returning faulthy here - an empty object in contrast would an empty base designTime, which would be matched with an empty allow list - thus not allowing anything. 
			return;
		}
		
			
		var oBaseDesignTime = deepExtend({}, oControlInfo.designTime);
		// not only designTime of control itself relevant, but also everything that is propagated from ancestors
		// => determine all ancestors
		
		var aAncestors = getAncestors(oControl);
		
		/* If no ancestors found, control is not relevant for FE, thus we must not change the designtime. This can be achieved by taking empty designtime as base. Don't take empty array instead - this
		 * would only ignore everything propagated to the control, but still take designtime defined on control itself as base, thus disallow everything defined directly.
		 */
		if (!aAncestors) {return;}
		
		// We need only those ancestors propagting metadata to the aggregation containing the given control.
		// The control itself obviously cannot propagate
		aAncestors.shift();
		// The view (of a template component) does propagate metadata, here we are actually inside this propagation, thus executing it here would create an endless loop
		aAncestors.pop();
		
		// build map with information about ancestors - as a 1. step only id is added
		var aAncestorInfo = aAncestors.map(function(oAncestor){
			return {
				oAncestor: oAncestor,
				sAncestorId: oAncestor.getId()
			};
		});

		// only those ancestors can be relevant designtime is provided for, and only if designtime defines aggregations
		aAncestorInfo = aAncestorInfo.filter(function(oAncestorInfo){
			return mControlInfo[oAncestorInfo.sAncestorId] && mControlInfo[oAncestorInfo.sAncestorId].designTime && mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations;
		});
		
		// determine corresponding aggregation name
		aAncestorInfo.forEach(function(oAncestorInfo){
			oAncestorInfo.sAggregation = getAncestorAggregationName(oAncestorInfo, oControl);
		});

		// filter for those ancestors actually propagating metadata to the corresponding aggregation
		oControlInfo.pedigree = aAncestorInfo.filter(function(oAncestorInfo){
			return mControlInfo[oAncestorInfo.sAncestorId] && mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations && mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations[oAncestorInfo.sAggregation] 
					&& mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations[oAncestorInfo.sAggregation].propagateMetadata;
		});
	
		// 
		oBaseDesignTime = oControlInfo.pedigree.reduce(function(oDesignTime, oAncestorInfo){
			/* Todo: Theoretically, also indirect propagation coudl be possible, i.e. A could propgate metadata to B, including propagation to C. In general, this seems to be superfluous (A could 
			 * directly propagate the same to C, as propagation is deep), and not used. If it would be used however, to be on the save side, we should not use the designtime directly defined on the 
			 * ancestor (i.e. from mControlInfo), but rather the resulting designtime after propagation from above. 
			 * One possibility could be to call getBaseDesigntime (i.e. this method) recursively. This recursion would end, as we removed the control itself from the ancestors - but we would do the same 
			 * analysis (determining ancestors) over and again within a quadratic function. (In the example, we would first determine A and B as ancestors of C, then (again) A being ancestor of B to).
			 * Another idea would be to reverse the ancestor tree, to call the propagation top down. However, this would also need to be quadratic - in a hierarchy A -> B -> C -> D, A could also 
			 * propagate metadata to C containing a propagation method relevant for D.
			 * Third (probably best) idea would be store any calculated baseDesignTime additionally in mControlInfo and use propagation method from there (if existing - otherwise determine 
			 * baseDesigntime first). As we are asked for propagation also in a top-down order, baseDesigntime should already be available for all ancestors, thus reducing our effort to be linear (while
			 * overall, it would still be quadratic over depth of control tree - but at least not cubic!). Open: Should we already trigger calculating besaDesigntime in that case for all controls as 
			 * soon as all directly defined designtimes are retrieved, or wait for propagation to be called?)
			 */
			return merge(oDesignTime, mControlInfo[oAncestorInfo.sAncestorId].designTime.aggregations[oAncestorInfo.sAggregation].propagateMetadata(oControl, oAncestorInfo.oAncestor));
		}, oBaseDesignTime); 
		
		return oBaseDesignTime;
	}	
	
	function getReducedDesignTime(oControl, oAllow){
		var oBaseDesignTime = getBaseDesignTime(oControl);
		/*
		 * If no base designTime at all, control is not relevant for FE (part of extension/reuse component (or not added to the view at all)): In this case, we must not reduce any possibilities, thus
		 * not returning a desginTime at all (not even for properties) 
		 */
		if (!oBaseDesignTime) {return;}
		
		var oResult = Object.create(null);
		
		if (oBaseDesignTime.actions && typeof oBaseDesignTime.actions === "object"){ // typeof null is object, but we need to treat it  like no object
			oResult.actions = Object.create(null); 
			// if "real" object, we can take over all actions according to our allow list. Setting all others to "not-adaptable" (although this might not be an expected string at this place)
			for (var sAction in oBaseDesignTime.actions){
				oResult.actions[sAction] = oAllow && oAllow.actions && oAllow.actions.includes(sAction) ? oBaseDesignTime.actions[sAction] : null;
			}
		} else {
			/* If base designtime actions is not an object, take over from base.
			 * Note: null and "not-adaptable" (which are the two typcial non-object values) are interpreted differently: While null as expected only affects actions (but is treated differently then 
			 * deleting this property (maybe also then undefined), "not-adaptable" also invalidates everything else in the designtime! (I.e. just because designtime says actions are not adaptable (which
			 * should ideally be relevant only in key user scenario), also no property changes are possible (which is relevant in design time adaption)) 
			 */
			oResult.actions = oBaseDesignTime.actions;
		}

		oResult.aggregations = Object.create(null); 
		for (var sAggregation in oBaseDesignTime.aggregations){
			oResult.aggregations[sAggregation] = {
					actions: Object.create(null)
			};
			for (var sAction in oBaseDesignTime.aggregations[sAggregation].actions){
				oResult.aggregations[sAggregation].actions[sAction] =  oAllow 
																	&& oAllow.aggregations 
																	&& oAllow.aggregations[sAggregation] 
																	&& oAllow.aggregations[sAggregation].actions 
																	&& oAllow.aggregations[sAggregation].actions.includes(sAction) ? oBaseDesignTime.aggregations[sAggregation].actions[sAction] : null;
			}
		}
		
		/*
		 * Unlike actions, properties (only relevant for dsign time adaptation / level 0) are allowed in general (i.e. if not specified as to be ignored) - thus we need to specify all properties, not 
		 * only what is mentioned in original designtime. However, if a property is already ignored from original designtime, we should not override this.
		 */
		oResult.properties = Object.create(null); 
		for (var sProperty in oControl.getMetadata().getAllProperties()){
			oResult.properties[sProperty] = {
				ignore: !oAllow || !oAllow.properties || !oAllow.properties.includes(sProperty) || (oBaseDesignTime.properties && oBaseDesignTime.properties[sProperty] && oBaseDesignTime.properties[sProperty].ignore)
			};
		}

		return oResult;
	}
	
	function getViewDesignTime(mAllow){
		return loadBaseDesigntime().then(function(){
			
			// provide propagation function for all controls contained allowing only what we want to allow
			var oDesignTime = {
				aggregations: {
					content: {
						propagateMetadata: function (oElement) {
							// propagateMetadata is also called for (reuse) components - but they don't have a method getElementName. Anyway, no need to provide (modified) designtime in this case, so just
							// ignore.
							return oElement.getMetadata().getElementName && getReducedDesignTime(oElement, mAllow[oElement.getMetadata().getElementName()]);
						}
					}
				},
				tool: {
					start: function(oView) {
						var oAppComponent = oView.getParent().getAppComponent();
						oAppComponent.uiAdaptationStarted();
					},
					stop: function(oView) {
						var oAppComponent = oView.getParent().getAppComponent();
						oAppComponent.uiAdaptationStopped();
					}
				}
			};
			
			// For View itself, we cannot wait for base designtime to load (and there is nothing to wait for - we're the ones defining it)
			// Nevertheless, we need to ensure only allowed properties to be changeable.
			
			// There might be several views. Different properties could exist (if inheritance is used) - to be sure, all properties of all views should not be alowed to change
			return aViews.reduce(function(oDesignTime, oView){
				return merge(getReducedDesignTime(oView, mAllow[oView.getMetadata().getElementName()]), oDesignTime);
			}, oDesignTime);
		});
	}
	
	// merge objects concatenating any contained arrays
	// open: if same property is array in one source, but not in the other one - currently resulting property will be "true" (which will probably never be expected)
	function deepMergeWithArray(aSource){
		return aSource.reduce(function(vResult, vSource){
			if (!vSource){
				// ignore undefined sources (rather not relevant on top level, but definitely in recursion as not properties need to exist in all source (objects)) => keep current result
				return vResult;
			}
			if (!vResult){
				// first source undefined => ignore and initialize result with next entry
				return vSource;
			}
			if (Array.isArray(vSource) !== Array.isArray(vResult)){
				// (type of) vResult is deviates from current source => conflict. Currently not expected, skip merging (to be adapted if need arises)
				// returning true to avoid overriding in next iteration
				return true;
			}

			if (Array.isArray(vResult)){
				return vResult.concat(vSource);
			} else {
				for (var sProperty in vSource){
					vResult[sProperty] = deepMergeWithArray([vResult[sProperty], vSource[sProperty]]);
				}
				return vResult;
			}
		});
	}
	
	return {
		getMergedAllowList: deepMergeWithArray, 
		getViewDesignTime: getViewDesignTime,
		getRtaModeValue : getRtaModeValue
	};
});
