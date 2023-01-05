// ==UserScript==
// @name         Auto display match data & PP Display
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically displays match data after completing a race and displays match PP scores
// @author       Disturbed
// @match        https://keymash.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=keymash.io
// @grant        none
// ==/UserScript==

(async function() {
    const star_ratings = await fetch('https://raw.githubusercontent.com/duhby/typing-pp/master/star_ratings.json').then(res => res.json())
    const get_textid = async(quote) => {
        return await fetch(`https://api.keymash.io/api/v2/texts/list?search=${encodeURI(quote)}&limit=5`)
            .then(response => response.json())
            .then(data => data[0].textId);
    }

    function get_score(stars, wpm) {
        return 35 * stars * curve_multiplier(wpm);
    }

    function curve_multiplier(wpm) {
        if (wpm < 100) {
            return wpm * 0.0045;
        }
        else if (wpm < 140) {
            return (wpm * 0.01) - 0.55;
        }
        else if (wpm < 214) {
            return (wpm * 0.0128378) - 0.947297;
        }
        else {
            return 0.102232 * (1.01349 ** wpm);
        }
    }


    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    while (true) {
        await waitForElm('.match--container');
        let wpmElm = document.querySelector("div.grid.grid-cols-1.gap-2.mt-5 > div > div.w-36.mr-4.my-auto.font-semibold.text-white");
        let matchButton = await waitForElm('#matchEnd > div > button:nth-child(2)').then(elm => elm.click());
        let quote = document.querySelector('#matchEnd > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2)').innerText.split('\n').join(' ');
        let wpm = wpmElm.innerText.split(' ')[0]
        let textid = await get_textid(quote);
        let stars = star_ratings[textid];
        let pp = get_score(stars, parseFloat(wpm)).toFixed(2);
        let ppDiv = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div > div:nth-child(2)").cloneNode(true);
        let statsContainer = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div");
        ppDiv.children[0].innerText = "Player Points";
        ppDiv.children[1].innerText = pp;
        statsContainer.appendChild(ppDiv);
    }
})();