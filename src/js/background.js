import '../img/icon-128.png'
import '../img/icon-34.png'

import '../img/on.png'
import '../img/off.png'
 
let accessControlRequestHeaders;
let exposedHeaders;

const REQUEST_HEADER_Origin = 'Origin'
const REQUEST_HEADER_access_control_request_headers = 'Origin'

const RESPONSE_HEADER_Access_Control_Allow_Origin = 'Access-Control-Allow-Origin'

let requestListener = function(details){
	let currentHost = '' // @todo 待替换成发起请求的地址

	for (let i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === REQUEST_HEADER_Origin.toLowerCase()) {
			details.requestHeaders[i].value = currentHost;
			break;
		}
	}
	details.requestHeaders.push(rule);
	
	for (let i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === REQUEST_HEADER_access_control_request_headers) {
			accessControlRequestHeaders = details.requestHeaders[i].value	
		}
	}	
	
	return {requestHeaders: details.requestHeaders};
};

let responseListener = function(details){
	let originHost = '' // @todo 待替换成cros的地址

	for (let i = 0; i < details.responseHeaders.length; ++i) {
		if (details.responseHeaders[i].name.toLowerCase() === RESPONSE_HEADER_Access_Control_Allow_Origin.toLowerCase()) {
			details.responseHeaders[i].value = originHost;
			break;
		}
	}
	details.responseHeaders.push(rule);

	if (accessControlRequestHeaders) {
		details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": accessControlRequestHeaders});
	}

	if(exposedHeaders) {
		details.responseHeaders.push({"name": "Access-Control-Expose-Headers", "value": exposedHeaders});
	}

	details.responseHeaders.push({"name": "Access-Control-Allow-Methods", "value": "GET, PUT, POST, DELETE, HEAD, OPTIONS"});

	return {responseHeaders: details.responseHeaders};
	
};

/*On install*/
chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.set({'active': false});
	chrome.storage.local.set({'urls': ["<all_urls>"]});
	chrome.storage.local.set({'exposedHeaders': ''});
	reload();
});

/*Reload settings*/
function reload() {
	chrome.storage.local.get({'active': false, 'urls': ["<all_urls>"], 'exposedHeaders': ''}, function(result) {

		exposedHeaders = result.exposedHeaders;

		/*Remove Listeners*/
		chrome.webRequest.onHeadersReceived.removeListener(responseListener);
		chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

		if(result.active) {
			chrome.browserAction.setIcon({path: "on.png"});

			if(result.urls.length) {

				/*Add Listeners*/
				chrome.webRequest.onHeadersReceived.addListener(responseListener, {
					urls: result.urls
				},["blocking", "responseHeaders"]);

				chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
					urls: result.urls
				},["blocking", "requestHeaders"]);
			}
		} else {
			chrome.browserAction.setIcon({path: "off.png"});
		}
	});
}
