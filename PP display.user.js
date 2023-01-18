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

(async function () {
    const star_ratings = await fetch('https://raw.githubusercontent.com/DisturbedProphet/Keymash-PP-display/main/starratings.json').then(res => res.json())
    alert(star_ratings);

    //This code is from https://github.com/duhby/typing-pp and will likely be subject to change as the PP system is developed further
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

    //returns a promise that resolves once a given element is created
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
        //halts the loop until the match starts
        await waitForElm('.match--container');

        let wpmElm = await waitForElm("div.grid.grid-cols-1.gap-2.mt-5 > div > div.w-36.mr-4.my-auto.font-semibold.text-white");

        //waits until the test is finished and automatically clicks the match button to display the match stats
        let matchButton = await waitForElm('#matchEnd > div > button:nth-child(2)').then(elm => elm.click());

        let quote = document.querySelector('#matchEnd > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2)').innerText.split('\n').join(' ');
        let wpm = wpmElm.innerText.split(' ')[0]
        let stars = star_ratings[quote].rating;
        let pp = get_score(stars, parseFloat(wpm)).toFixed(2);

        //clone the WPM display div and replaces the contents with the proper PP data
        let ppDiv = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div > div:nth-child(2)").cloneNode(true);
        let statsContainer = document.querySelector("#matchEnd > div.bg-black.bg-opacity-20.h-auto.lg\\:min-h-128.rounded-b-2xl.shadow-lg.p-4.sm\\:p-6.md\\:p-8.relative > div.text-white > div > div.col-span-full.md\\:col-span-1 > div");
        ppDiv.children[0].innerText = "Performance Points";
        ppDiv.children[1].innerText = pp;
        statsContainer.appendChild(ppDiv);
    }
})();
