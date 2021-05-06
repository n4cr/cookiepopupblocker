function treatAsUTC(date) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const num = (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
    return Math.round(num)
}


function hide(element) {
    element.classList.add('hidden')
}

function show(element) {
    element.classList.remove('hidden')
}

function signedUp() {
    const signup = document.getElementById('signup')
    hide(signup)
    const signUpSuccess = document.getElementById('signUpSuccess')
    show(signUpSuccess)
}

function registerFailed() {

    const err = document.getElementById('registerError')
    show(err)
}

function addListeners() {
    const checkLicenseButton = document.getElementById('checkLicenseButton')
    console.log(checkLicenseButton);
    checkLicenseButton.addEventListener('click', () => {
        const err = document.getElementById('registerError')
        hide(err)

        const input = document.getElementById('licenseInput')
        const key = input.value;
        const data = new URLSearchParams({
            'product_permalink': 'cookie-popup-blocker',
            'license_key': key,
            'increment_uses_count': false
        })
        fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            body: data
        }).then(resp => resp.json()).then(result => {
            console.log(result)
            if (result.success) {
                chrome.storage.sync.set({subscribed: true})
                signedUp()
                console.log('Subscribtion Successful')
            } else {
                registerFailed()
            }
        }).catch(error => {
            registerFailed()
        })

    })
}

function showCount() {
    const countEl = document.getElementById('count')
    chrome.storage.sync.get('blockCount', function (result) {
        const count = result.blockCount == undefined ? 0 : result.blockCount;
        countEl.innerText = count
    });
}

console.log('loaded')

addListeners()
showCount();

chrome.storage.sync.set({subscribed: false})

chrome.storage.sync.get(['subscribed', 'setupDate'], result => {
    if (!result.subscribed) {
        const signup = document.getElementById('signup')
        show(signup)

        const setupDate = result.setupDate ? new Date(result.setupDate) : new Date()
        const days = daysBetween(setupDate, new Date())
        const daysLeft = days < 7 ? 7 - days : 0;
        const daysLeftEl = document.getElementById('daysLeft')
        daysLeftEl.innerText = daysLeft;
    }
})

