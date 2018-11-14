import "../css/popup.css";


chrome.storage.local.get({ 'isActive': false }, function (result) {
    let { isActive } = result
    if (isActive) {
        // alert('is on, try to close1')
        chrome.storage.local.set({ isActive: false })
        console.log('closed')
        chrome.browserAction.setIcon({ path: "off.png" })
        console.log('chrome =>', chrome)
		chrome.extension.getBackgroundPage().reload()
    } else {
        // alert('is off, try to open2')
        chrome.storage.local.set({ isActive: true })
        console.log('opened')
        chrome.browserAction.setIcon({ path: "on.png" })
        console.log('chrome =>', chrome)
		chrome.extension.getBackgroundPage().reload()
    }
})