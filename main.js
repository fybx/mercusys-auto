#!/usr/bin/env node
const puppeteer = require('puppeteer');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const config = require('./configuration.json');

let MAX_RETRIES = 11;

const argv = yargs(hideBin(process.argv)).argv;

if (Object.keys(argv).length === 1) {
	console.log("setting all:", argv._[0]);
	init(argv._[0], argv._[0]);
} else if (Object.keys(argv).length === 2) {
	console.log("setting 2.4 GHz:", argv._[0], "5 GHz:", argv._[1]);
	init(argv._[0], argv._[1]);
} else {
	console.log('Dude wtf');
}

async function openBrowserSession() {
	let browser = await puppeteer.launch({ headless: 'shell' });
	const page = (await browser.pages())[0];
	await Promise.all([page.goto(config.url), page.waitForNavigation()]);
	return { browser: browser, page: page };
}

async function login(page) {
    await delay(1000);
	await page.waitForSelector('#lgPwd');
	await page.type('#lgPwd', config.password);
    await delay(1000);

    await page.click('#loginSub').catch(() => page.click('.btnR'));
	return page;
}

async function openWirelessSettings(page) {
	await page.waitForSelector('#wirelessMbtn');
	await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await delay(1000);
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await page.click('#wirelessMbtn');
    await delay(1000);

	await Promise.all([
		page.waitForSelector('#switchCon', { visible: true }).then(() => console.log('located switchCon')),
		page.waitForSelector('#switchCon5G', { visible: true }).then(() => console.log('located switchCon5G')),
	]);
	return page;
}

async function getWirelessStatus(page) {
    await delay(1000);
    await Promise.all([
        page.waitForSelector('#switchCon', { visible: true }),
        page.waitForSelector('#switchCon5G', { visible: true })
    ]);

	return await page.evaluate(() => {
		const parent2 = document.getElementById('switchCon');
		const parent5 = document.getElementById('switchCon5G');

		const children2 = parent2.querySelector('.switchBall').style.left;
		const children5 = parent5.querySelector('.switchBall').style.left;

		const status2 = children2 === '2px' ? 'on' : 'off';
		const status5 = children5 === '2px' ? 'on' : 'off';

		return [status2, status5];
	});
}

async function init(arg24, arg5) {
    MAX_RETRIES--;
	let { browser, page } = await openBrowserSession();
    try {
		page = await login(page);
		page = await openWirelessSettings(page);
		let status = await getWirelessStatus(page);

		console.log('2.4 GHz status: ', status[0]);
		console.log('5 GHz status: ', status[1]);

		do {
			if (arg24 !== status[0]) {
				await crazyClicker(page, 'switchCon');
				console.log('clicked 2.4 GHz');
			}
			if (arg5 !== status[1]) {
				await crazyClicker(page, 'switchCon5G');
				console.log('clicked 5 GHz');
			}
			await delay(1000);
			status = await getWirelessStatus(page);
		} while (status[0] !== arg24 || status[1] !== arg5);
	} catch (error) {
		console.log(error);
		MAX_RETRIES != 0 ? init(arg24, arg5) : console.log('Max retries reached');
	} finally {
		await browser.close();
	}
}

async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function crazyClicker(page, parentDivId) {
	await page.evaluate((parentDivId) => {
		const whichDiv = document.getElementById(parentDivId);

		whichDiv.querySelector('.switchBg').click();

		const switchBall = whichDiv.querySelector('.switchBall');
		const mouseDownEvent = new MouseEvent('mousedown', {
			bubbles: true,
			cancelable: true,
			view: window,
		});
		switchBall.dispatchEvent(mouseDownEvent);
	}, parentDivId);
}

