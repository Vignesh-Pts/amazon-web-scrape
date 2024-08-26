import { Browser } from 'puppeteer';
import { PurchasedProducts } from './interface/purchased-products';

const puppeteer = require('puppeteer');
const signInUrl: string = 'https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2F%3Fref_%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeAmazonWithPuppeteer() {
    const browser: Browser = await puppeteer.launch({
        headless: false, // Set to true if you want to run Chrome in headless mode
        defaultViewport: null, // Use the default viewport size
        args: ['--start-maximized'] // Optional: Maximize the window
    });

    try {       
        const page = await browser.newPage();
        await page.goto(signInUrl, { waitUntil: 'networkidle2' });    
    
        // Perform login
        await page.type('#ap_email', '');  // email id or ph number to replace in the second argument    
        await page.click('#continue');
    
        await page.waitForSelector('#ap_password');
        await page.type('#ap_password', '');  // password to replace in the second argument 
        await page.click('#signInSubmit');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
        await page.waitForSelector('#nav-orders');
        await page.click('#nav-orders');
        await page.waitForSelector('.your-orders-content-container .js-order-card .order', { visible: true });

        await delay(10000); // Delay for 10 seconds

        
        const result = await page.evaluate(() => {
            // code to run in the browser's page context
            const items: PurchasedProducts[] = [];

            Array.from(document.querySelectorAll('.your-orders-content-container .order-card')).slice(0, 10).forEach(order => {
                const price = order.querySelector('.order-info .yohtmlc-order-total .a-color-secondary > span')?.textContent?.trim();
                const productName = order.querySelector('.shipment-is-delivered .a-col-left .a-col-right .a-link-normal')?.textContent?.trim();
                const relativeUrl = order.querySelector('.shipment-is-delivered .a-col-left .a-col-right .a-link-normal')?.getAttribute('href'); // Returns the relative url
                const productLink: string = new URL(relativeUrl as string, document.baseURI).href;
                
                items.push({ 
                    title: (productName as string).replace(/\n+/g, ' ').replace(/\s+/g, ' '), // Replace new lines and multiple spaces with a space
                    price, 
                    link: productLink 
                });                
            });

            return items;
        });

        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('inside finally');
        await browser.close();
    }
}

scrapeAmazonWithPuppeteer();

// Instructions to run the program
// 1. Run command npm run build to compile our ts code to js code
// 2. Once it is compiled, the compiled code will be under dist folder
// 3. Run command npm run start to run the application