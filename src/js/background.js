import '../img/icon-128.png'

import '../img/on.png'
import '../img/off.png'
import _ from 'lodash'
import parse from 'url-parse'

function parseHost(url) {
	let result = parse(url)
	console.log('result =>' ,result)
	let host = `${result['protocol']}//${result['host']}`
	return host
}

let requestMap = {}

const METHOD_OPTIONS = 'OPTIONS'

const LEAGAL_Access_Control_Allow_Methods = 'GET, PUT, POST, DELETE, HEAD, OPTIONS'

const REQUEST_HEADER_Origin = 'Origin'
const REQUEST_HEADER_Access_Control_Request_Method = 'Access-Control-Request-Method'
const REQUEST_HEADER_Access_Control_Request_Headers = 'Access-Control-Request-Headers'


const RESPONSE_HEADER_Access_Control_Allow_Origin = 'Access-Control-Allow-Origin'
const RESPONSE_HEADER_Access_Control_Allow_Headers = 'Access-Control-Allow-Headers'

const RESPONSE_HEADER_Access_Control_Allow_Methods = 'Access-Control-Allow-Methods'
const RESPONSE_HEADER_Access_Control_Allow_Credentials = 'Access-Control-Allow-Credentials'

// detals =>
// {"frameId":0,"initiator":"http://localhost:8081","method":"GET","parentFrameId":-1,"requestHeaders":[{"name":"Accept","value":"application/json, text/plain, */*"},{"name":"Origin","value":"http://localhost:8081"},{"name":"User-Agent","value":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36"},{"name":"DNT","value":"1"},{"name":"Content-Type","value":"application/x-www-form-urlencoded"},{"name":"Referer","value":"http://localhost:8081/growth_cp/0.3.54/html/demo/index.html"},{"name":"Accept-Encoding","value":"gzip, deflate, br"},{"name":"Accept-Language","value":"zh-CN,zh;q=0.9,en-GB;q=0.8,en;q=0.7"}],"requestId":"17160","tabId":390502223,"timeStamp":1542039353855.9128,"type":"xmlhttprequest","url":"https://www.baidu.com/"}
let requestListener = function (details) {
	console.log('request start =>', details)
	let requestHost = parseHost(_.get(details, ['url'], ''))
	let requestId = _.get(details, ['requestId'], 0)
	let tabId = _.get(details, ['tabId'], 0)
	
	console.log("requestHost =>", requestHost)
	
	// @todo 允许配置origin字段
	let originHost = ''
	let requestHeaders = ''
	let requestMethods = ''

	// 只需要把请求头备份下来
	// 确保存入 Origin, Access_Control_Request_Headers, Access_Control_Request_Method 三个的信息即可
	for (let requestHeader of details.requestHeaders) {
		switch (requestHeader.name) {
			case REQUEST_HEADER_Origin:
				originHost = requestHeader.value
				// 若请求地址和当前地址一致, 直接返回即可
				if (originHost === requestHost) {
					console.log("并非跨域请求, 直接返回")
					return {}
				}else{
					console.log("跨域请求 =>" , {originHost , requestHost})
				}
			case REQUEST_HEADER_Access_Control_Request_Headers:
				requestHeaders = requestHeader.value
				break;
			case REQUEST_HEADER_Access_Control_Request_Method:
				requestMethods = requestHeader.value
				break;
			default:
		}
	}
	if(requestHeaders){
		_.set(requestMap, [tabId, requestId, REQUEST_HEADER_Access_Control_Request_Headers], originHost)
	}
	if(requestMethods){
		_.set(requestMap, [tabId, requestId, REQUEST_HEADER_Access_Control_Request_Method], originHost)
	}

	// 只要跨域, 就把源站地址记上
	_.set(requestMap, [tabId, requestId, REQUEST_HEADER_Origin], originHost)
	return {};
};

// response details =>
// "{"frameId":0,"method":"GET","parentFrameId":-1,"requestId":"18047","responseHeaders":[{"name":"status","value":"304"},{"name":"cache-control","value":"public, max-age=0, no-cache"},{"name":"x-cloud-trace-context","value":"7ec6c14b1945bdb92fe44d93c652a058"},{"name":"vary","value":"Accept-Encoding"},{"name":"date","value":"Mon, 12 Nov 2018 17:45:54 GMT"},{"name":"server","value":"Google Frontend"},{"name":"alt-svc","value":"quic=\":443\"; ma=2592000; v=\"44,43,39,35\""},{"name":"x-frame-options","value":"sameorigin"},{"name":"etag","value":"\"75ded9fb5470300e788098037b85ad8e\""},{"name":"content-type","value":"application/x-javascript"},{"name":"content-encoding","value":"gzip"},{"name":"content-length","value":"1380"}],"statusCode":200,"statusLine":"HTTP/1.1 200","tabId":390502494,"timeStamp":1542044752997.385,"type":"script","url":"https://developer.chrome.com/static/js/article.js"}"
let responseListener = function (details) {
	console.log('response start =>', details)

	let requestId = _.get(details, ['requestId'], 0)
	let tabId = _.get(details, ['tabId'], 0)

	if (_.has(requestMap, [tabId, requestId]) === false) {
		// 没有储存相应跨域配置信息, 直接跳过
		console.log("没有储存相应跨域配置信息, 直接跳过")
		return {}
	}

	console.log("检测到跨域, 开始处理")
	let originHost = _.get(requestMap, [tabId, requestId, REQUEST_HEADER_Origin], '')

	let appendHeaderList = []

	// for (let responseHeader of details.responseHeaders) {
	// 	switch (responseHeader.name) {
	// 		case RESPONSE_HEADER_Access_Control_Allow_Origin:
	// 			responseHeader.value = originHost
	// 			appendHeaderList.push(responseHeader)
	// 			break;
	// 		// 以下不必处理, 直接加进去即可
	// 		case RESPONSE_HEADER_Access_Control_Allow_Methods:
	// 		case RESPONSE_HEADER_Access_Control_Allow_Headers:
	// 		case RESPONSE_HEADER_Access_Control_Allow_Credentials:
	// 			break;
	// 		default:
	// 	}
	// }
	appendHeaderList.push({
		name: RESPONSE_HEADER_Access_Control_Allow_Origin,
		value: originHost
	})
	appendHeaderList.push({
		name: RESPONSE_HEADER_Access_Control_Allow_Credentials,
		value: 'true'
	})
	appendHeaderList.push({
		name: RESPONSE_HEADER_Access_Control_Allow_Methods,
		value: LEAGAL_Access_Control_Allow_Methods
	})
	if (_.has(requestMap, [tabId, requestId, REQUEST_HEADER_Access_Control_Request_Headers])) {
		let headers = _.get(requestMap, [tabId, requestId, REQUEST_HEADER_Access_Control_Request_Headers], '')
		appendHeaderList.push({
			name: RESPONSE_HEADER_Access_Control_Allow_Headers,
			value: headers
		})
	}

	details.responseHeaders = details.responseHeaders.concat(appendHeaderList)
	console.log("response finish =>", details.responseHeaders)
	return { responseHeaders: details.responseHeaders };
};

/*On install*/
chrome.runtime.onInstalled.addListener(function () {
	console.log('chrome.runtime.onInstalled.addListener')
	chrome.storage.local.set({ 'isActive': false });
	reload();
});

/*Reload settings*/
function reload() {
	console.log('reload has call')
	chrome.storage.local.get({ 'isActive': false }, function (result) {

		let { isActive } = result
		console.log("now isActive =>", isActive)

		/*Remove Listeners*/
		chrome.webRequest.onHeadersReceived.removeListener(responseListener);
		chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

		if (isActive) {
			chrome.browserAction.setIcon({ path: "on.png" });

			/*Add Listeners*/
			chrome.webRequest.onHeadersReceived.addListener(responseListener, {
				urls: []
			}, ["blocking", "responseHeaders"]);

			chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
				urls: []
			}, ["blocking", "requestHeaders"]);
		} else {
			chrome.browserAction.setIcon({ path: "off.png" });
		}
	});
}

// 必须要显式注入到window里, 否则popup无法调用
window.reload = reload