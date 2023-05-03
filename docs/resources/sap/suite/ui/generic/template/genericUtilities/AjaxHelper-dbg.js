sap.ui.define([
	"sap/ui/util/XMLHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeError"
], function(XMLHelper, testableHelper, FeError) {
	"use strict";
	var	sClassName = "genericUtilities.AjaxHelper";

	var RETURN_STATUS = {
		ERROR: "error",
		PARSING_ERROR: "parsing error",
		DATA_TYPE_NOT_SUPPORTED: "data type not supported",
		SUCCESS: "success"
	};
	var ajaxHelper = {};
	var REQUEST_DEFAUTLS = "GET";
	var allowedDataTypes = ["text", "json", "xml", "plain"];

	/**
	 * A convenient method to make XMLHTTPRequest with different types of http methods, with a few settings.
	 * @param setting an object expects following
	 * {
	 * 		url   		@type (boolean): Resource url
	 * 		async 		@type (boolean): whether request is async or not; default value is true
	 * 		type		@type (string): method type; GET, PUT, POST, DELETE, PATCH
	 * 		dtatType 	@type (string):(string): text, json, xml
	 * 		data		@type (object or string) : to be passed to server, only valid when request is not GET
	 * }
	 * @returns response object if async is false, promise if async is true (default).
	 *  promise is resolved or rejected with a response object with following fields:-
	 * {
	 * 		request		@type (XMLHttpRequest): xhr request
	 * 		sucess		@type (boolean): flag which tells request is successful or not
	 * 		statusCode	@type (Number): statusCode returned by server
	 * 		data		@type (undefined or document or json or string): data returned by server if request is successfull
	 * 		textStatus	@type (string): text status of request like success, error, timeout, aborted
	 * 		error		@type (object or string): actual error, may be object or a string
	 * }
	 */
	ajaxHelper.ajax = function (mSettings){
		if (!mSettings || typeof mSettings !== "object") {
			throw new FeError(sClassName, "send a valid setting object to call ajax");
		}
		var isAsync = (mSettings && mSettings.async) === undefined ? true : mSettings.async;
		var type = mSettings.type || REQUEST_DEFAUTLS;
		var url = mSettings.url;
		if (!url || typeof url !== "string" ) {
			throw new FeError(sClassName, "Provide a proper url to make AJAX call");
		}
		var params = encodeData(mSettings.data);
		var isGet = type === REQUEST_DEFAUTLS;
		if (params && isGet) {
			url = url + "?" + params;
		}
		testableHelper.testable(handelResponse, "handelResponse");
		testableHelper.testable(encodeData, "encodeData");
		testableHelper.testable(parseJson, "parseJson");
		testableHelper.testable(parseXML, "parseXML");
		var oReq = new XMLHttpRequest();
		// is Request is asynchronous, create a promise and return
		if (isAsync) {
			var oPromise = new Promise(function(resolve, reject) {
				oReq.addEventListener("load", fnTransferComplete);
				oReq.addEventListener("error", fnTransferFailed);
				oReq.addEventListener("abort", fnTransferCanceled);
				oReq.open(type, url, isAsync);
				oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				isGet ? oReq.send() : oReq.send(params);
				function fnTransferComplete(event) {
					var oResponse = handelResponse(event, mSettings);
					if (oResponse.success) {
						return resolve(oResponse);
					}
					return reject(oResponse);
				}
				function fnTransferFailed(event) {
					reject(handelError(event));
				}
				function fnTransferCanceled(event) {
					reject(handelAbort(event));
				}
			});
			return oPromise;
		} else {
				// create a json response synchronous and return it
				var response;
				oReq.addEventListener("load", function fnTransferComplete(event) {
					response = handelResponse(event, mSettings);
				});
				oReq.addEventListener("error", function fnTransferFailed(event) {
					response = handelError(event);
				});
				oReq.addEventListener("abort", function fnTransferCanceled(event) {
					response = handelAbort(event);
				});
				oReq.open(type, url, isAsync);
				oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				try {
					// In synchronous ajax requests send function does not return untill it gets any response
					// from server. When it gets response from server, it will call attached eventHandler.
					isGet ? oReq.send() : oReq.send(params);
				} catch (error) {
					response = {};
					response.statusCode = oReq.status;
					response.request = oReq;
					response.success = false;
					response.textStatus = RETURN_STATUS.ERROR;
					response.error = error;
				}
				// We will reach at this statement when send function has returned and attached eventHandler has
				// been called.
				return response;
		}
	};
	/**
	 * Returns getJson object asynchronously from server using xhr
	 * @param url: Resource location
	 * @returns promise which is resolved with json Object or rejected with error
	 */
	ajaxHelper.getJSON = function (url) {
		return new Promise(function (resolve, reject){
			ajaxHelper.ajax({url:url, async:true, dataType:"json"}).then(function (response) {
				resolve(response.data);
			}).catch(function(response) {
				reject(response.error);
			});
		});
	};
	/**
	 * Makes synchronous XHR call
	 * @param setting an object, expects following
	 * {
	 * 		url   		@type (boolean): url to be hit
	 * 		type		@type (string): method type; GET, PUT, POST, DELETE, PATCH
	 * 		dtatType 	@type (string):(string): text, json, xml
	 * 		data		@type (object or string) : to be passed to server, only valid when request is not GET
	 * }
	 * @returns response object with following fields
=	 * {
	 * 		request		@type (XMLHttpRequest): xhr request
	 * 		sucess		@type (boolean): flag which tells request is successful or not
	 * 		statusCode	@type (Number): statusCode returned by server
	 * 		data		@type (undefined or document or json or string): data returned by server if request is successfull
	 * 		textStatus	@type (string): text status of request like success, error, timeout, aborted
	 * 		error		@type (object or string): actual error, may be object or a string, if any
	 * }
	 */
	ajaxHelper.sjax = function (mSettings){
		if (mSettings.async) {
			throw new FeError(sClassName, "AjaxHelper.sjax should not be called with async flag set");
		}
		mSettings.async = false;
		return this.ajax(mSettings);
	};

	/**
	 * Returns the JSON object synchronously based on the passed resource URI
	 * @param url: Resource location
	 * @returns response object which with following properties
=	 * {
	 * 		request		@type (XMLHttpRequest): xhr request
	 * 		sucess		@type (boolean): flag which tells request is successful or not
	 * 		statusCode	@type (Number): statusCode returned by server
	 * 		data		@type (undefined or document or json or string): data returned by server if request is successfull
	 * 		textStatus	@type (string): text status of request like success, error, timeout, aborted
	 * 		error		@type (object or string): actual error, may be object or a string, if any
	 * }
	 */
	ajaxHelper.syncGetJSON = function (url) {
		return ajaxHelper.sjax({url:url, dataType:"json"});
	};

	/**
	 * Handel the scenario when we get response from server
	 * @param {XMLHTTPReques load event} event
	 * @param {mSettings} settings passed while calling ajaxHelper.ajax function
	 * @returns prepare and returns whole response object which is
	 * in turn returned by calling function.
	 * this function sets all the fields in response object which is
	 * returned by AjaxHelper.ajax function.
	 */
	function handelResponse(event, mSettings) {
		var status = event.target.status;
		/**
		 * At the end we prepare response object with following fields:
		 * {
	 	 * 		request		@type (XMLHttpRequest): xhr request
	 	 * 		sucess		@type (boolean): flag which tells request is successful or not
	 	 * 		statusCode	@type (Number): statusCode returned by server
	 	 * 		data		@type (undefined or document or json or string): data returned by server if request is successfull
	 	 * 		textStatus	@type (string): text status of request like success, error, timeout, aborted
	 	 * 		error		@type (object or string): actual error, may be object or a string, if any
	 	 * }
		 */
		var response = {};
		var dataType = mSettings.dataType;
		// According to status code returned by server we check success or faliure
		var success = (status >= 200 && status < 300) || status === 304 ;
		if (success){
			// if data type is given then parse respone according to that
			// throw any error if not able to parse.
			if (dataType) {
				switch (dataType) {
					case "json": response = parseJson(event.target.responseText);
								 break;
					case "xml": response = parseXML(event.target.responseText);
								break;
					case "text": response.data = event.target.responseText;
								 break;
					default: response.success = false;
							 response.textStatus = RETURN_STATUS.ERROR;
							 response.error = RETURN_STATUS.DATA_TYPE_NOT_SUPPORTED;
				}
			} else {
				// if not then from response content-type header try to parse response
				var contentTypeHeader = event.target.getResponseHeader("content-type");
				if (contentTypeHeader) {
					// Content-Type: application/json; charset=UTF-8
					// Content-Type: text/plain; charset=utf-8
					var contentType = contentTypeHeader.split("/")[1].split(";")[0];
					if (allowedDataTypes.indexOf(contentType) + 1) {
						dataType = contentType;
						response.request = event.target;
						switch (dataType) {
							case "json": response = parseJson(event.target.responseText);
										 break;
							case "xml": response = parseXML(event.target.responseText);
										break;
							default: response.data = event.target.responseText;
									break;
						}

					} else {
						response.success = false;
						response.textStatus = RETURN_STATUS.ERROR;
						response.error = RETURN_STATUS.DATA_TYPE_NOT_SUPPORTED;
					}
				}
			}
		} else {
			// we got failure case
			response.success = false;
			response.textStatus = RETURN_STATUS.ERROR;
			response.error = event.target.statusText || RETURN_STATUS.ERROR;
		}
		response.request = event.target;
		response.statusCode = event.target.status;
		response.success = response.success !== false;
		if (response.success) {
			response.textStatus = RETURN_STATUS.SUCCESS;
		}
		return response;
	}

	/**
	 * Handel Error event and perpare a Error response
	 * @param {XMLHTTPReques error event} event
	 * @returns response object with following field set
	 * {
	 * 		statusCode
	 * 		XHRRequest
	 * 		textStatus
	 * 		success
	 * }
	 */
	function handelError(event) {
		var response = {};
		response.statusCode = event.target.status;
		response.request = event.target;
		response.success = false;
		response.textStatus = RETURN_STATUS.ERROR;
		response.error = event.target.statusText || RETURN_STATUS.ERROR;
		return response;
	}
	/**
	 * Handel abort event and perpare a abort response
	 * @param {XMLHTTPReques error event} event
	 * @returns response object with following field set
	 *  * {
	 * 		statusCode
	 * 		XHRRequest
	 * 		textStatus
	 * 		success
	 * }
	 */
	function handelAbort(event) {
		var response = {};
		response.statusCode = event.target.status;
		response.request = event.target;
		response.success = false;
		response.textStatus = "aborted";
		return response;
	}
	/**
	 *
	 * @param @type:(string) xmlString
	 * @returns {
		* 				data: json object
		* 				success : boolean
		* 				textStatus: if any error then error status
		* 				error : if any error
		* 			}
		*/
	function parseJson(jsonString) {
		var response = {};
		try {
			response.data = jsonString === "" ? undefined : JSON.parse(jsonString);
		} catch (error) {
			response.success = false;
			response.textStatus = RETURN_STATUS.PARSING_ERROR;
			response.error = error;
		}
		return response;
	}
	/**
	 *
	 * @param @type:(string) xmlString
	 * @returns {
	 * 				data: XML document
	 * 				success : boolean
	 * 				textStatus: if any error then error status
	 * 				error : if any error
	 * 			}
	 */
	function parseXML (xmlString) {
		var response = {};
		var oXmlDocument = XMLHelper.parse(xmlString);
		if (oXmlDocument.parseError.errorCode !== 0) {
			response.success = false;
			response.textStatus = RETURN_STATUS.PARSING_ERROR;
			response.error = oXmlDocument.parseError.reason;
			return response;
		}
		response.data = oXmlDocument;
		return response;
	}
	/**
	 * encodes the data in url encode formate
	 * @param {javascript object} data
	 */
	function encodeData(data){
		var params;
		if (data) {
			params = typeof data == 'string' ? data : Object.keys(data).map( function(k) {
				return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
			}
			).join('&');
		}
		return params;
	}
	return ajaxHelper;
});
